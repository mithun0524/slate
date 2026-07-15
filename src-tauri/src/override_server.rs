//! Agent override channel.
//!
//! A tiny line-oriented TCP server on 127.0.0.1. A Claude Code hook (or any
//! tool) can force Pane B to a view by sending one JSON `ViewIntent` per line:
//!
//! ```sh
//! echo '{"kind":"tree"}'                | nc 127.0.0.1 8477
//! echo '{"kind":"spec","path":"X.md"}'  | nc 127.0.0.1 8477
//! echo '{"kind":"diff","paths":[]}'     | nc 127.0.0.1 8477
//! ```
//!
//! Failures here never block the app — if the port is taken we simply log and
//! fall back to classifier-only behaviour.

use crate::types::{IntentEvent, IntentSource, ViewIntent};
use std::io::{BufRead, BufReader};
use std::net::TcpListener;
use tauri::{AppHandle, Emitter};

pub const PORT: u16 = 8477;

/// Bind the override socket and serve forever on a background thread.
pub fn start(app: AppHandle) {
    std::thread::spawn(move || {
        let listener = match TcpListener::bind(("127.0.0.1", PORT)) {
            Ok(l) => l,
            Err(e) => {
                eprintln!("[vellum] override socket disabled: {e}");
                return;
            }
        };
        for stream in listener.incoming() {
            let stream = match stream {
                Ok(s) => s,
                Err(_) => continue,
            };
            // Handle each connection on its own thread so a client that holds
            // the socket open never blocks subsequent overrides.
            let app = app.clone();
            std::thread::spawn(move || {
                let reader = BufReader::new(stream);
                for line in reader.lines() {
                    let line = match line {
                        Ok(l) => l,
                        Err(_) => break,
                    };
                    let trimmed = line.trim();
                    if trimmed.is_empty() {
                        continue;
                    }
                    match serde_json::from_str::<ViewIntent>(trimmed) {
                        Ok(intent) => {
                            let _ = app.emit(
                                "vellum://intent",
                                IntentEvent {
                                    intent,
                                    source: IntentSource::Override,
                                },
                            );
                        }
                        Err(e) => eprintln!("[vellum] bad override payload: {e}"),
                    }
                }
            });
        }
    });
}
