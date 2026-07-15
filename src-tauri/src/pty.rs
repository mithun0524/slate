//! A single pseudo-terminal session running the user's shell (where Claude Code
//! is launched). Output is streamed to the frontend over `pty://data`; the
//! child's exit is announced on `pty://exit`. The shell is launched with a
//! small integration hook so it emits an OSC 7 sequence on every directory
//! change — we parse that out of the stream and emit `pty://cwd`, letting
//! Panel B follow the terminal's directory.

use portable_pty::{native_pty_system, ChildKiller, CommandBuilder, PtySize};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Emitter};

/// Emit the valid-UTF-8 prefix of `pending` to the frontend, leaving any
/// incomplete trailing multi-byte sequence in `pending` for the next read.
fn emit_decoded(app: &AppHandle, pending: &mut Vec<u8>) {
    loop {
        match std::str::from_utf8(pending) {
            Ok(s) => {
                if !s.is_empty() {
                    let _ = app.emit("pty://data", s.to_string());
                }
                pending.clear();
                return;
            }
            Err(e) => {
                let valid = e.valid_up_to();
                if valid > 0 {
                    let s = unsafe { std::str::from_utf8_unchecked(&pending[..valid]) };
                    let _ = app.emit("pty://data", s.to_string());
                    pending.drain(..valid);
                }
                match e.error_len() {
                    Some(bad) => {
                        let _ = app.emit("pty://data", "\u{fffd}".to_string());
                        pending.drain(..bad);
                    }
                    None => return,
                }
            }
        }
    }
}

/// State machine that extracts OSC 7 (`ESC ] 7 ; file://host/path ST`) cwd
/// reports from the raw byte stream, running alongside the passthrough decode.
#[derive(Default)]
struct OscScanner {
    state: OscState,
    buf: Vec<u8>,
}
#[derive(Default, PartialEq)]
enum OscState {
    #[default]
    Idle,
    Esc,
    Osc,
    OscEsc,
}

impl OscScanner {
    fn feed(&mut self, byte: u8, app: &AppHandle) {
        match self.state {
            OscState::Idle => {
                if byte == 0x1b {
                    self.state = OscState::Esc;
                }
            }
            OscState::Esc => {
                if byte == 0x5d {
                    // ']'
                    self.state = OscState::Osc;
                    self.buf.clear();
                } else if byte != 0x1b {
                    self.state = OscState::Idle;
                }
            }
            OscState::Osc => {
                if byte == 0x07 {
                    self.finish(app);
                } else if byte == 0x1b {
                    self.state = OscState::OscEsc;
                } else if self.buf.len() < 8192 {
                    self.buf.push(byte);
                } else {
                    self.state = OscState::Idle;
                }
            }
            OscState::OscEsc => {
                // Expect '\' to complete ST; anything else = malformed.
                if byte == 0x5c {
                    self.finish(app);
                } else {
                    self.state = OscState::Idle;
                }
            }
        }
    }

    fn finish(&mut self, app: &AppHandle) {
        let s = String::from_utf8_lossy(&self.buf);
        if let Some(rest) = s.strip_prefix("7;") {
            if let Some(path) = parse_file_url(rest) {
                let _ = app.emit("pty://cwd", path);
            }
        }
        self.buf.clear();
        self.state = OscState::Idle;
    }
}

/// `file://host/Users/x` (or a bare `/path`) -> decoded filesystem path.
fn parse_file_url(s: &str) -> Option<String> {
    let path = if let Some(after) = s.strip_prefix("file://") {
        // Skip the authority (host) up to the first '/'.
        match after.find('/') {
            Some(i) => &after[i..],
            None => return None,
        }
    } else if s.starts_with('/') {
        s
    } else {
        return None;
    };
    Some(percent_decode(path))
}

fn percent_decode(s: &str) -> String {
    let bytes = s.as_bytes();
    let mut out: Vec<u8> = Vec::with_capacity(bytes.len());
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'%' && i + 2 < bytes.len() {
            let hex = std::str::from_utf8(&bytes[i + 1..i + 3]).ok();
            if let Some(v) = hex.and_then(|h| u8::from_str_radix(h, 16).ok()) {
                out.push(v);
                i += 3;
                continue;
            }
        }
        out.push(bytes[i]);
        i += 1;
    }
    String::from_utf8_lossy(&out).into_owned()
}

/// Build the shell command with cwd-reporting integration when we recognise the
/// shell (zsh / bash). Unknown shells launch plainly (no directory following).
fn build_shell_command(cwd: &Path) -> CommandBuilder {
    let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/zsh".to_string());
    let base = Path::new(&shell)
        .file_name()
        .and_then(|s| s.to_str())
        .unwrap_or("");

    let mut cmd = CommandBuilder::new(&shell);
    cmd.cwd(cwd);
    cmd.env("TERM", "xterm-256color");

    let integ = std::env::temp_dir().join("vellum-shell");
    match base {
        "zsh" if write_zsh_integration(&integ).is_ok() => {
            if let Ok(existing) = std::env::var("ZDOTDIR") {
                cmd.env("VELLUM_USER_ZDOTDIR", existing);
            }
            cmd.env("ZDOTDIR", integ.to_string_lossy().to_string());
        }
        "bash" => {
            if let Ok(rc) = write_bash_integration(&integ) {
                cmd.arg("--rcfile");
                cmd.arg(rc.to_string_lossy().to_string());
                cmd.arg("-i");
            }
        }
        _ => {}
    }
    cmd
}

fn write_zsh_integration(dir: &Path) -> std::io::Result<()> {
    std::fs::create_dir_all(dir)?;
    // ZDOTDIR override: source the user's real .zshrc, then add cwd hooks.
    let body = r#"# Vellum shell integration
if [ -n "$VELLUM_USER_ZDOTDIR" ] && [ -r "$VELLUM_USER_ZDOTDIR/.zshrc" ]; then
  source "$VELLUM_USER_ZDOTDIR/.zshrc"
elif [ -r "$HOME/.zshrc" ]; then
  source "$HOME/.zshrc"
fi
__vellum_cwd() { printf '\033]7;file://%s%s\033\\' "${HOST}" "$PWD"; }
autoload -Uz add-zsh-hook 2>/dev/null && add-zsh-hook precmd __vellum_cwd && add-zsh-hook chpwd __vellum_cwd
__vellum_cwd
"#;
    std::fs::write(dir.join(".zshrc"), body)
}

fn write_bash_integration(dir: &Path) -> std::io::Result<PathBuf> {
    std::fs::create_dir_all(dir)?;
    let rc = dir.join("vellum.bash");
    let body = r#"# Vellum shell integration
[ -r "$HOME/.bashrc" ] && source "$HOME/.bashrc"
__vellum_cwd() { printf '\033]7;file://%s%s\033\\' "${HOSTNAME}" "$PWD"; }
case "$PROMPT_COMMAND" in
  *__vellum_cwd*) ;;
  *) PROMPT_COMMAND="__vellum_cwd;${PROMPT_COMMAND}" ;;
esac
__vellum_cwd
"#;
    std::fs::write(&rc, body)?;
    Ok(rc)
}

/// Live handle to the pty master + writer, held in app state.
pub struct PtySession {
    master: Box<dyn portable_pty::MasterPty + Send>,
    writer: Box<dyn Write + Send>,
    killer: Box<dyn ChildKiller + Send + Sync>,
}

impl Drop for PtySession {
    fn drop(&mut self) {
        let _ = self.killer.kill();
    }
}

impl PtySession {
    pub fn spawn(app: &AppHandle, cwd: &Path, cols: u16, rows: u16) -> Result<Self, String> {
        let pty_system = native_pty_system();
        let pair = pty_system
            .openpty(PtySize {
                rows,
                cols,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| e.to_string())?;

        let cmd = build_shell_command(cwd);

        let mut child = pair.slave.spawn_command(cmd).map_err(|e| e.to_string())?;
        drop(pair.slave);

        let killer = child.clone_killer();

        let mut reader = pair.master.try_clone_reader().map_err(|e| e.to_string())?;
        let writer = pair.master.take_writer().map_err(|e| e.to_string())?;

        // Reader thread: passthrough decode + OSC 7 cwd scan.
        let app_read = app.clone();
        std::thread::spawn(move || {
            let mut buf = [0u8; 8192];
            let mut pending: Vec<u8> = Vec::new();
            let mut osc = OscScanner::default();
            loop {
                match reader.read(&mut buf) {
                    Ok(0) => break,
                    Ok(n) => {
                        for &b in &buf[..n] {
                            osc.feed(b, &app_read);
                        }
                        pending.extend_from_slice(&buf[..n]);
                        emit_decoded(&app_read, &mut pending);
                    }
                    Err(_) => break,
                }
            }
        });

        let app_exit = app.clone();
        std::thread::spawn(move || {
            let code = child.wait().ok().map(|s| s.exit_code()).unwrap_or(0);
            let _ = app_exit.emit("pty://exit", code);
        });

        Ok(PtySession {
            master: pair.master,
            writer,
            killer,
        })
    }

    pub fn write(&mut self, data: &str) -> Result<(), String> {
        self.writer
            .write_all(data.as_bytes())
            .map_err(|e| e.to_string())?;
        self.writer.flush().map_err(|e| e.to_string())
    }

    pub fn resize(&self, cols: u16, rows: u16) -> Result<(), String> {
        self.master
            .resize(PtySize {
                rows,
                cols,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| e.to_string())
    }
}
