import { useEffect, useMemo, useRef, useState } from "react";
import { readText, searchText, type FileMatches, type LineMatch } from "../lib/ipc";
import { FileIcon } from "./FileIcon";
import { SplitPane } from "./SplitPane";

function Highlight({ text, col, len }: { text: string; col: number; len: number }) {
  const chars = Array.from(text);
  return (
    <>
      {chars.slice(0, col).join("")}
      <mark className="sr-hit">{chars.slice(col, col + len).join("")}</mark>
      {chars.slice(col + len).join("")}
    </>
  );
}

interface Selected {
  file: FileMatches;
  line: number;
}

// Read the file and show it with matched lines highlighted, scrolled to the
// clicked line — a preview beside the results (no navigating away).
function FilePreview({ sel }: { sel: Selected }) {
  const [lines, setLines] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    readText(sel.file.path)
      .then((t) => alive && (setLines(t.split("\n")), setErr(null)))
      .catch((e) => alive && setErr(String(e)));
    return () => {
      alive = false;
    };
  }, [sel.file.path]);

  // First match per line, for inline highlighting.
  const byLine = useMemo(() => {
    const m = new Map<number, LineMatch>();
    for (const x of sel.file.matches) if (!m.has(x.line)) m.set(x.line, x);
    return m;
  }, [sel.file]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      activeRef.current?.scrollIntoView({ block: "center" });
    }, 20);
    return () => window.clearTimeout(t);
  }, [sel, lines]);

  return (
    <div className="fp">
      <div className="view-crumb">
        <span className="crumb-label">{sel.file.path}</span>
      </div>
      {err ? (
        <div className="view-empty">{err}</div>
      ) : (
        <div className="fp-scroll">
          {lines.map((text, i) => {
            const ln = i + 1;
            const m = byLine.get(ln);
            const active = ln === sel.line;
            return (
              <div
                key={i}
                ref={active ? activeRef : undefined}
                className={`fp-line ${m ? "match" : ""} ${active ? "active" : ""}`}
              >
                <span className="fp-lineno">{ln}</span>
                <span className="fp-code">
                  {m ? <Highlight text={text} col={m.col} len={m.len} /> : text || " "}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function SearchView() {
  const [query, setQuery] = useState("");
  const [cs, setCs] = useState(false);
  const [ww, setWw] = useState(false);
  const [rx, setRx] = useState(false);
  const [results, setResults] = useState<FileMatches[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [sel, setSel] = useState<Selected | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const reqRef = useRef(0);

  useEffect(() => {
    window.clearTimeout(timer.current);
    if (query.trim().length < 2) {
      setResults([]);
      setErr(null);
      setSel(null);
      return;
    }
    setBusy(true);
    timer.current = window.setTimeout(() => {
      const myReq = ++reqRef.current;
      searchText(query, cs, ww, rx)
        .then((r) => {
          if (reqRef.current !== myReq) return;
          setResults(r);
          setErr(null);
          setSel(null);
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

  const total = useMemo(() => results.reduce((n, f) => n + f.matches.length, 0), [results]);

  const toggle = (p: string) =>
    setCollapsed((s) => {
      const n = new Set(s);
      n.has(p) ? n.delete(p) : n.add(p);
      return n;
    });

  const resultsEl = (
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
                  className={`sr-match ${sel?.file.path === f.path && sel.line === m.line ? "on" : ""}`}
                  onClick={() => setSel({ file: f, line: m.line })}
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
  );

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
      ) : sel ? (
        <div className="sr-main">
          <SplitPane left={resultsEl} right={<FilePreview sel={sel} />} initial={0.4} min={0.25} max={0.7} />
        </div>
      ) : (
        <div className="sr-main">{resultsEl}</div>
      )}
    </div>
  );
}
