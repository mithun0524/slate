import { useEffect, useMemo, useRef, useState } from "react";
import { readText, type LineMatch } from "../lib/ipc";

/// Inline highlight of one match inside a line.
export function Highlight({ text, col, len }: { text: string; col: number; len: number }) {
  const chars = Array.from(text);
  return (
    <>
      {chars.slice(0, col).join("")}
      <mark className="sr-hit">{chars.slice(col, col + len).join("")}</mark>
      {chars.slice(col + len).join("")}
    </>
  );
}

// Read-only view of a workspace file: every line numbered, optional search
// matches highlighted, optionally scrolled to a line.
//
// Used by the search view (preview beside results) and by the diff view when a
// file has nothing to diff — clicking a file used to dead-end on an empty diff.
export function FileView({
  path,
  matches,
  activeLine,
  crumb = true,
}: {
  path: string;
  matches?: LineMatch[];
  activeLine?: number;
  crumb?: boolean;
}) {
  const [lines, setLines] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let alive = true;
    readText(path)
      .then((t) => alive && (setLines(t.split("\n")), setErr(null)))
      .catch((e) => alive && setErr(String(e)));
    return () => {
      alive = false;
    };
  }, [path]);

  // First match per line, for inline highlighting.
  const byLine = useMemo(() => {
    const m = new Map<number, LineMatch>();
    for (const x of matches ?? []) if (!m.has(x.line)) m.set(x.line, x);
    return m;
  }, [matches]);

  useEffect(() => {
    if (activeLine == null) return;
    const t = window.setTimeout(() => {
      activeRef.current?.scrollIntoView({ block: "center" });
    }, 20);
    return () => window.clearTimeout(t);
  }, [activeLine, path, lines]);

  return (
    <div className="fp">
      {crumb && (
        <div className="view-crumb">
          <span className="crumb-label">{path}</span>
          <span className="crumb-stat">
            {lines.length} {lines.length === 1 ? "line" : "lines"}
          </span>
        </div>
      )}
      {err ? (
        <div className="view-empty">{err}</div>
      ) : (
        <div className="fp-scroll">
          {lines.map((text, i) => {
            const ln = i + 1;
            const m = byLine.get(ln);
            const active = ln === activeLine;
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
