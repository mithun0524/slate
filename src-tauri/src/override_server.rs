//! Agent channel: a line-oriented TCP server on 127.0.0.1.
//!
//! Two message shapes (one JSON object per line):
//!   • View override — force Panel B to a view:
//!       {"kind":"tree"}   {"kind":"spec","path":"X.md"}   {"kind":"diff","paths":[]}
//!   • Approval request — ask the human, block for the answer:
//!       {"approval":{"id":"a1","title":"Ship these changes?","detail":"3 files"}}
//!     The server holds the connection open and writes back one line:
//!       {"approved":true}   (or false on reject / 180s timeout)
//!
//! Failures never block the app — if the port is taken we log and fall back to
//! classifier-only behaviour.

use crate::types::{IntentEvent, IntentSource, ViewIntent};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::io::{BufRead, BufReader, Write};
use std::net::TcpListener;
use std::sync::mpsc::{channel, Sender};
use std::sync::Mutex;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager};

pub const PORT: u16 = 8477;

/// Pending approvals awaiting a human decision, keyed by request id.
#[derive(Default)]
pub struct ApprovalRegistry(pub Mutex<HashMap<String, Sender<bool>>>);

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ApprovalRequest {
    pub id: String,
    pub title: String,
    #[serde(default)]
    pub detail: String,
}

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
            let app = app.clone();
            std::thread::spawn(move || {
                let mut writer = stream.try_clone().ok();
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
                    let val: serde_json::Value = match serde_json::from_str(trimmed) {
                        Ok(v) => v,
                        Err(e) => {
                            eprintln!("[vellum] bad payload: {e}");
                            continue;
                        }
                    };

                    // Approval request?
                    if let Some(ap) = val.get("approval") {
                        if let Ok(req) = serde_json::from_value::<ApprovalRequest>(ap.clone()) {
                            let approved = await_decision(&app, req);
                            if let Some(w) = writer.as_mut() {
                                let _ = writeln!(w, "{{\"approved\":{approved}}}");
                                let _ = w.flush();
                            }
                            continue;
                        }
                    }

                    // Otherwise treat as a view override.
                    if let Ok(intent) = serde_json::from_value::<ViewIntent>(val) {
                        let _ = app.emit(
                            "vellum://intent",
                            IntentEvent { intent, source: IntentSource::Override },
                        );
                    }
                }
            });
        }
    });
}

/// Register the request, notify the UI, and block until a decision (or timeout).
fn await_decision(app: &AppHandle, req: ApprovalRequest) -> bool {
    let (tx, rx) = channel::<bool>();
    let reg = app.state::<ApprovalRegistry>();
    {
        let mut map = reg.0.lock().unwrap();
        // Don't clobber an in-flight request with the same id (would reject it).
        if map.contains_key(&req.id) {
            return false;
        }
        map.insert(req.id.clone(), tx);
    } // lock released before blocking

    let _ = app.emit("vellum://approval", req.clone());

    let decision = match rx.recv_timeout(Duration::from_secs(180)) {
        Ok(v) => v,
        Err(_) => {
            // Timed out (or sender dropped): tell the UI to drop the card.
            let _ = app.emit("vellum://approval-expired", req.id.clone());
            false
        }
    };
    reg.0.lock().unwrap().remove(&req.id);
    decision
}
