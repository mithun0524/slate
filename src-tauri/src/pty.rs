//! A single pseudo-terminal session running the user's shell (where Claude Code
//! is launched). Output is streamed to the frontend over `pty://data`; the
//! child's exit is announced on `pty://exit`.

use portable_pty::{native_pty_system, ChildKiller, CommandBuilder, PtySize};
use std::io::{Read, Write};
use std::path::Path;
use tauri::{AppHandle, Emitter};

/// Emit the valid-UTF-8 prefix of `pending` to the frontend, leaving any
/// incomplete trailing multi-byte sequence in `pending` for the next read.
/// Genuinely invalid bytes are replaced (never stall the stream).
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
                    // Safe: bytes [..valid] are valid UTF-8 by definition.
                    let s = unsafe { std::str::from_utf8_unchecked(&pending[..valid]) };
                    let _ = app.emit("pty://data", s.to_string());
                    pending.drain(..valid);
                }
                match e.error_len() {
                    // Invalid byte(s): emit a replacement char and skip them.
                    Some(bad) => {
                        let _ = app.emit("pty://data", "\u{fffd}".to_string());
                        pending.drain(..bad);
                    }
                    // Incomplete trailing sequence: keep it for the next chunk.
                    None => return,
                }
            }
        }
    }
}

/// Live handle to the pty master + writer, held in app state.
pub struct PtySession {
    master: Box<dyn portable_pty::MasterPty + Send>,
    writer: Box<dyn Write + Send>,
    /// Kills the child shell on drop, which closes the pty and lets the reader
    /// and waiter threads reach EOF and exit (no orphan process / thread leak).
    killer: Box<dyn ChildKiller + Send + Sync>,
}

impl Drop for PtySession {
    fn drop(&mut self) {
        let _ = self.killer.kill();
    }
}

impl PtySession {
    /// Spawn a shell in `cwd` with the given initial size and start streaming
    /// its output to the frontend.
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

        let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/zsh".to_string());
        let mut cmd = CommandBuilder::new(shell);
        cmd.cwd(cwd);
        cmd.env("TERM", "xterm-256color");

        let mut child = pair
            .slave
            .spawn_command(cmd)
            .map_err(|e| e.to_string())?;
        // The slave handle is no longer needed once the child owns it.
        drop(pair.slave);

        // Grab a killer before the child is moved into the waiter thread.
        let killer = child.clone_killer();

        let mut reader = pair
            .master
            .try_clone_reader()
            .map_err(|e| e.to_string())?;
        let writer = pair.master.take_writer().map_err(|e| e.to_string())?;

        // Reader thread: pump bytes -> frontend. Decode UTF-8 incrementally so a
        // multi-byte character split across two reads is never mangled — the
        // incomplete trailing bytes are held over to the next chunk.
        let app_read = app.clone();
        std::thread::spawn(move || {
            let mut buf = [0u8; 8192];
            let mut pending: Vec<u8> = Vec::new();
            loop {
                match reader.read(&mut buf) {
                    Ok(0) => break,
                    Ok(n) => {
                        pending.extend_from_slice(&buf[..n]);
                        emit_decoded(&app_read, &mut pending);
                    }
                    Err(_) => break,
                }
            }
        });

        // Waiter thread: announce exit.
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
