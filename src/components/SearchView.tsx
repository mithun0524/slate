import { useEffect, useMemo, useRef, useState } from "react";
import { searchText, type FileMatches } from "../lib/ipc";
import { FileIcon } from "./FileIcon";

function Highlight({ text, col, len }: { text: string; col: number; len: number }) {
  const chars = Array.from(text);
  const before = chars.slice(0, col).join("");
  const hit = chars.slice(col, col + len).join("");
  const after = chars.slice(col + len).join("");
  return (
    <>
      {before}
      <mark className="sr-hit">{hit}</mark>
      {after}
    </>
  );
}

// Pane B / full-text search across the workspace.
export function SearchView({ onSelectFile }: { onSelectFile: (p: string) => void }) {
  const [query, setQuery] = useState("");
  const [cs, setCs] = useState(false);
  const [ww, setWw] = useState(false);
  const [rx, setRx] = useState(false);
  const [results, setResults] = useState<FileMatches[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const timer = useRef<number | undefined>(undefined);
  const reqRef = useRef(0);

  useEffect(() => {
    window.clearTimeout(timer.current);
    if (query.trim().length < 2) {
      setResults([]);
      setErr(null);
      return;
    }
    setBusy(true);
    timer.current = window.setTimeout(() => {
      const myReq = ++reqRef.current;
      searchText(query, cs, ww, rx)
        .then((r) => {
          if (reqRef.current !== myReq) return; // stale result
          setResults(r);
          setErr(null);
        })
        .catch((e) => {
          if (reqRef.current !== myReq) return;
          setErr(String(e));
          setResults([]);
        })
        .finally(() => {
          if (reqRef.current === myReq) setBusy(false);
        });
    }, 200);
    return () => window.clearTimeout(timer.current);
  }, [query, cs, ww, rx]);

  const total = useMemo(
    () => results.reduce((n, f) => n + f.matches.length, 0),
    [results],
  );

  const toggle = (p: string) =>
    setCollapsed((s) => {
      const n = new Set(s);
      n.has(p) ? n.delete(p) : n.add(p);
      return n;
    });

  return (
    <div className="view search-view">
      <div className="sr-head">
        <div className="sr-field">
          <input
            className="sr-input"
            placeholder="Search in files…"
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            autoFocus
          />
          <div className="sr-toggles">
            <button className={`sr-tog ${cs ? "on" : ""}`} title="Match case" onClick={() => setCs((v) => !v)}>
              Aa
            </button>
            <button className={`sr-tog ${ww ? "on" : ""}`} title="Whole word" onClick={() => setWw((v) => !v)}>
              <u>ab</u>
            </button>
            <button className={`sr-tog ${rx ? "on" : ""}`} title="Regular expression" onClick={() => setRx((v) => !v)}>
              .*
            </button>
          </div>
        </div>
        {query.trim().length >= 2 && !err && (
          <div className="sr-summary">
            {busy ? "searching…" : `${total} results in ${results.length} files`}
          </div>
        )}
      </div>

      {err ? (
        <div className="view-empty">{err}</div>
      ) : results.length === 0 ? (
        <div className="view-empty">
          <div className="empty-glyph">⌕</div>
          {query.trim().length >= 2 ? "No matches." : "Type to search files."}
        </div>
      ) : (
        <div className="sr-results">
          {results.map((f) => {
            const open = !collapsed.has(f.path);
            const base = f.path.split("/").pop() || f.path;
            const dir = f.path.split("/").slice(0, -1).join("/");
            return (
              <div className="sr-file" key={f.path}>
                <button className="sr-file-head" onClick={() => toggle(f.path)}>
                  <span className={`chev ${open ? "open" : ""}`}>▸</span>
                  <FileIcon name={base} />
                  <span className="sr-file-name">{base}</span>
                  {dir && <span className="sr-file-dir">{dir}</span>}
                  <span className="sr-file-count">{f.matches.length}</span>
                </button>
                {open &&
                  f.matches.map((m, i) => (
                    <button
                      key={i}
                      className="sr-match"
                      onClick={() => onSelectFile(f.path)}
                      title={`${f.path}:${m.line}`}
                    >
                      <span className="sr-lineno">{m.line}</span>
                      <span className="sr-line">
                        <Highlight text={m.text} col={m.col} len={m.len} />
                      </span>
                    </button>
                  ))}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
