import { useEffect, useState } from "react";
import { gitDiff } from "../lib/ipc";

type Line = { cls: string; text: string };

// Parse unified-diff patch text into classed lines for rendering.
function parse(patch: string): Line[] {
  return patch.split("\n").map((line) => {
    let cls = "ctx";
    if (line.startsWith("+++") || line.startsWith("---")) cls = "meta";
    else if (line.startsWith("diff ") || line.startsWith("index ")) cls = "meta";
    else if (line.startsWith("@@")) cls = "hunk";
    else if (line.startsWith("+")) cls = "add";
    else if (line.startsWith("-")) cls = "del";
    return { cls, text: line };
  });
}

// Pane B / diff view: unified diff of the working tree. `paths` restricts the
// diff; empty = whole workdir. `refreshKey` forces a re-fetch.
export function DiffView({
  paths,
  refreshKey,
}: {
  paths: string[];
  refreshKey: number;
}) {
  const [lines, setLines] = useState<Line[]>([]);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    gitDiff(paths)
      .then((patch) => {
        if (!alive) return;
        setLines(parse(patch));
        setErr(null);
      })
      .catch((e) => alive && setErr(String(e)));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, paths.join("|")]);

  const empty = lines.every((l) => l.text.trim() === "");

  return (
    <div className="view diff-view">
      <div className="view-crumb">
        diff · {paths.length ? paths.join(", ") : "working tree"}
      </div>
      {err ? (
        <div className="view-empty">{err}</div>
      ) : empty ? (
        <div className="view-empty">No diff — nothing changed vs HEAD.</div>
      ) : (
        <pre className="diff-scroll">
          {lines.map((l, i) => (
            <div key={i} className={`diff-line ${l.cls}`}>
              {l.text || " "}
            </div>
          ))}
        </pre>
      )}
    </div>
  );
}
