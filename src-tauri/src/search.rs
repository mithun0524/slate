//! Workspace-wide scans: full-text search and the markdown/spec listing.
//!
//! Pure functions over a root path (no Tauri `State`), so they are unit
//! testable and can be moved off the main thread by the command layer.

use crate::scan::walk;
use crate::types::{FileMatches, LineMatch};
use regex::RegexBuilder;
use std::path::Path;

/// Caps so a pathological repo can't hang the UI.
const MAX_FILES: usize = 300;
const MAX_TOTAL: usize = 3000;
const PER_FILE: usize = 40;
const MAX_LINE: usize = 500;
/// Files larger than this are skipped outright (they're generated, not source).
const MAX_FILE_BYTES: usize = 2 * 1024 * 1024;
/// Upper bound on the spec listing.
const MAX_SPECS: usize = 5000;

pub struct Opts {
    pub case_sensitive: bool,
    pub whole_word: bool,
    pub regex_mode: bool,
}

/// Full-text search under `root`, grouped by file and sorted by path.
pub fn search(root: &Path, query: &str, opts: &Opts) -> Result<Vec<FileMatches>, String> {
    if query.trim().is_empty() {
        return Ok(Vec::new());
    }

    let mut pat = if opts.regex_mode {
        query.to_string()
    } else {
        regex::escape(query)
    };
    if opts.whole_word {
        // Group so alternation/anchors bind inside the word boundaries.
        pat = format!(r"\b(?:{pat})\b");
    }
    let re = RegexBuilder::new(&pat)
        .case_insensitive(!opts.case_sensitive)
        .build()
        .map_err(|e| e.to_string())?;

    let mut out: Vec<FileMatches> = Vec::new();
    let mut total = 0usize;

    for entry in walk(root).flatten() {
        if out.len() >= MAX_FILES || total >= MAX_TOTAL {
            break;
        }
        if !entry.file_type().map(|t| t.is_file()).unwrap_or(false) {
            continue;
        }
        let path = entry.path();
        // Read as text; skip binaries / unreadable / huge files.
        let bytes = match std::fs::read(path) {
            Ok(b) if b.len() <= MAX_FILE_BYTES && !b.contains(&0) => b,
            _ => continue,
        };
        let text = match String::from_utf8(bytes) {
            Ok(t) => t,
            Err(_) => continue,
        };

        let mut matches: Vec<LineMatch> = Vec::new();
        for (i, line) in text.lines().enumerate() {
            if let Some(m) = re.find(line) {
                matches.push(line_match(line, i + 1, m.start(), m.as_str()));
                total += 1;
                if matches.len() >= PER_FILE || total >= MAX_TOTAL {
                    break;
                }
            }
        }
        if !matches.is_empty() {
            out.push(FileMatches {
                path: rel(root, path),
                matches,
            });
        }
    }
    out.sort_by(|a, b| a.path.cmp(&b.path));
    Ok(out)
}

/// Every markdown file under `root`, relative and sorted, for the spec tree.
pub fn list_markdown(root: &Path) -> Vec<String> {
    let mut out: Vec<String> = Vec::new();
    for entry in walk(root).flatten() {
        if out.len() >= MAX_SPECS {
            break;
        }
        if !entry.file_type().map(|t| t.is_file()).unwrap_or(false) {
            continue;
        }
        let name = entry.file_name().to_string_lossy().to_ascii_lowercase();
        if name.ends_with(".md") || name.ends_with(".markdown") {
            out.push(rel(root, entry.path()));
        }
    }
    out.sort();
    out
}

fn rel(root: &Path, path: &Path) -> String {
    path.strip_prefix(root)
        .unwrap_or(path)
        .to_string_lossy()
        .to_string()
}

/// Build a `LineMatch`, windowing very long lines around the hit so the
/// highlight offsets the frontend receives stay valid.
fn line_match(line: &str, line_no: usize, byte_col: usize, hit: &str) -> LineMatch {
    let col_chars = line[..byte_col].chars().count();
    let len = hit.chars().count() as u32;
    let all: Vec<char> = line.chars().collect();
    let (text, col) = if all.len() > MAX_LINE {
        let start = col_chars.saturating_sub(40);
        let end = (start + MAX_LINE).min(all.len());
        let mut s: String = all[start..end].iter().collect();
        let mut c = col_chars - start;
        if start > 0 {
            s.insert(0, '…');
            c += 1;
        }
        (s, c as u32)
    } else {
        (line.to_string(), col_chars as u32)
    };
    LineMatch {
        line: line_no as u32,
        col,
        len,
        text,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::path::PathBuf;

    fn fixture(name: &str) -> PathBuf {
        let root = std::env::temp_dir().join(format!("vellum-search-{name}"));
        let _ = fs::remove_dir_all(&root);
        fs::create_dir_all(root.join("src")).unwrap();
        fs::create_dir_all(root.join("node_modules")).unwrap();
        fs::create_dir_all(root.join("docs")).unwrap();
        fs::create_dir_all(root.join("build")).unwrap();
        fs::write(root.join(".gitignore"), "generated/\n").unwrap();
        fs::create_dir_all(root.join("generated")).unwrap();
        fs::write(root.join("src/a.rs"), "let needle = 1;\nlet other = 2;\n").unwrap();
        fs::write(root.join("src/b.rs"), "// needle needle\n").unwrap();
        fs::write(root.join("node_modules/c.js"), "needle\n").unwrap();
        fs::write(root.join("generated/d.rs"), "needle\n").unwrap();
        fs::write(root.join("docs/spec.md"), "# needle spec\n").unwrap();
        fs::write(root.join("build/out.md"), "# ignored\n").unwrap();
        fs::write(root.join("bin.dat"), [b'n', 0u8, b'x']).unwrap();
        root
    }

    fn opts() -> Opts {
        Opts {
            case_sensitive: false,
            whole_word: false,
            regex_mode: false,
        }
    }

    #[test]
    fn finds_matches_and_skips_ignored_trees() {
        let root = fixture("basic");
        let hits = search(&root, "needle", &opts()).unwrap();
        let paths: Vec<&str> = hits.iter().map(|h| h.path.as_str()).collect();
        assert_eq!(paths, vec!["docs/spec.md", "src/a.rs", "src/b.rs"]);
        // one match per line, first hit only
        assert_eq!(hits[2].matches.len(), 1);
        assert_eq!(hits[1].matches[0].line, 1);
        assert_eq!(hits[1].matches[0].col, 4);
        assert_eq!(hits[1].matches[0].len, 6);
    }

    #[test]
    fn binary_files_are_skipped() {
        let root = fixture("binary");
        let hits = search(&root, "n", &opts()).unwrap();
        assert!(!hits.iter().any(|h| h.path == "bin.dat"), "{hits:?}");
    }

    #[test]
    fn whole_word_and_case_flags_apply() {
        let root = fixture("flags");
        fs::write(root.join("src/c.rs"), "needles\nNEEDLE\n").unwrap();

        let whole = search(
            &root,
            "needle",
            &Opts {
                case_sensitive: false,
                whole_word: true,
                regex_mode: false,
            },
        )
        .unwrap();
        let c = whole.iter().find(|h| h.path == "src/c.rs").unwrap();
        // "needles" must not match; "NEEDLE" must (case-insensitive).
        assert_eq!(c.matches.len(), 1);
        assert_eq!(c.matches[0].line, 2);

        let cased = search(
            &root,
            "NEEDLE",
            &Opts {
                case_sensitive: true,
                whole_word: false,
                regex_mode: false,
            },
        )
        .unwrap();
        assert_eq!(cased.len(), 1);
        assert_eq!(cased[0].path, "src/c.rs");
    }

    #[test]
    fn bad_regex_is_an_error_not_a_panic() {
        let root = fixture("badre");
        let err = search(
            &root,
            "(unclosed",
            &Opts {
                case_sensitive: false,
                whole_word: false,
                regex_mode: true,
            },
        );
        assert!(err.is_err());
    }

    #[test]
    fn long_lines_are_windowed_with_valid_offsets() {
        let root = fixture("long");
        let mut line = "x".repeat(2000);
        line.push_str("needle");
        fs::write(root.join("src/long.rs"), &line).unwrap();

        let hits = search(&root, "needle", &opts()).unwrap();
        let m = &hits.iter().find(|h| h.path == "src/long.rs").unwrap().matches[0];
        let chars: Vec<char> = m.text.chars().collect();
        let slice: String = chars[m.col as usize..(m.col + m.len) as usize].iter().collect();
        assert_eq!(slice, "needle", "highlight offset must survive windowing");
    }

    #[test]
    fn markdown_listing_respects_ignores() {
        let root = fixture("md");
        let specs = list_markdown(&root);
        assert_eq!(specs, vec!["docs/spec.md".to_string()]);
    }
}
