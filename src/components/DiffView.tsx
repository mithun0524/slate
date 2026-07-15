import { useEffect, useMemo, useState } from "react";
import { gitDiff } from "../lib/ipc";

type LineType = "add" | "del" | "ctx";
interface DiffLine {
  type: LineType;
  oldNo: number | null;
  newNo: number | null;
  text: string;
}
interface Hunk {
  header: string;
  lines: DiffLine[];
}
interface FileDiff {
  path: string;
  hunks: Hunk[];
  additions: number;
  deletions: number;
  binary: boolean;
}

// Parse unified-diff patch text into per-file, per-hunk numbered lines.
function parseDiff(patch: string): FileDiff[] {
  const files: FileDiff[] = [];
  let file: FileDiff | null = null;
  let hunk: Hunk | null = null;
  let oldNo = 0;
  let newNo = 0;

  const push = () => {
    if (file) {
      if (hunk) file.hunks.push(hunk);
      files.push(file);
    }
  };

  for (const line of patch.split("\n")) {
    if (line.startsWith("diff --git")) {
      push();
      const m = line.match(/ b\/(.+)$/);
      file = {
        path: m ? m[1] : line.replace("diff --git ", ""),
        hunks: [],
        additions: 0,
        deletions: 0,
        binary: false,
      };
      hunk = null;
      continue;
    }
    if (!file) continue;
    if (line.startsWith("+++ ")) {
      const p = line.slice(4).replace(/^b\//, "");
      if (p && p !== "/dev/null") file.path = p;
      continue;
    }
    if (line.startsWith("--- ")) continue;
    if (line.startsWith("index ") || line.startsWith("new file") || line.startsWith("deleted file") || line.startsWith("rename ") || line.startsWith("similarity ")) continue;
    if (line.startsWith("Binary files") || line.includes("GIT binary patch")) {
      file.binary = true;
      continue;
    }
    if (line.startsWith("@@")) {
      if (hunk) file.hunks.push(hunk);
      hunk = { header: line, lines: [] };
      const m = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      oldNo = m ? parseInt(m[1], 10) : 0;
      newNo = m ? parseInt(m[2], 10) : 0;
      continue;
    }
    if (!hunk) continue;
    const sign = line[0];
    const text = line.slice(1);
    if (sign === "+") {
      hunk.lines.push({ type: "add", oldNo: null, newNo: newNo++, text });
      file.additions++;
    } else if (sign === "-") {
      hunk.lines.push({ type: "del", oldNo: oldNo++, newNo: null, text });
      file.deletions++;
    } else {
      hunk.lines.push({ type: "ctx", oldNo: oldNo++, newNo: newNo++, text });
    }
  }
  push();
  return files;
}

function FileBlock({ file }: { file: FileDiff }) {
  const [open, setOpen] = useState(true);
  const name = file.path.split("/").pop();
  const dir = file.path.split("/").slice(0, -1).join("/");

  return (
    <div className="dfile">
      <button className="dfile-head" onClick={() => setOpen((v) => !v)}>
        <span className={`chev ${open ? "open" : ""}`}>▸</span>
        <span className="dfile-name">
          {dir && <span className="dfile-dir">{dir}/</span>}
          {name}
        </span>
        <span className="dfile-stat">
          {file.additions > 0 && <span className="add">+{file.additions}</span>}
          {file.deletions > 0 && <span className="del">−{file.deletions}</span>}
        </span>
      </button>
      {open && (
        <div className="dfile-body">
          {file.binary ? (
            <div className="dbinary">Binary file — no textual diff</div>
          ) : (
            file.hunks.map((h, hi) => (
              <div className="dhunk" key={hi}>
                <div className="dhunk-head">{h.header}</div>
                {h.lines.map((l, li) => (
                  <div className={`dline ${l.type}`} key={li}>
                    <span className="gutter old">{l.oldNo ?? ""}</span>
                    <span className="gutter new">{l.newNo ?? ""}</span>
                    <span className="sign">
                      {l.type === "add" ? "+" : l.type === "del" ? "−" : ""}
                    </span>
                    <span className="code">{l.text || " "}</span>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// Pane B / diff view: per-file cards with numbered gutters and hunk bands.
export function DiffView({
  paths,
  refreshKey,
}: {
  paths: string[];
  refreshKey: number;
}) {
  const [patch, setPatch] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    gitDiff(paths)
      .then((p) => alive && (setPatch(p), setErr(null)))
      .catch((e) => alive && setErr(String(e)));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, paths.join("|")]);

  const files = useMemo(() => parseDiff(patch), [patch]);
  const totals = useMemo(
    () =>
      files.reduce(
        (a, f) => ({ add: a.add + f.additions, del: a.del + f.deletions }),
        { add: 0, del: 0 },
      ),
    [files],
  );

  return (
    <div className="view diff-view">
      <div className="view-crumb">
        <span className="crumb-label">
          diff · {paths.length ? paths.join(", ") : "working tree"}
        </span>
        {files.length > 0 && (
          <span className="crumb-stat">
            {files.length} {files.length === 1 ? "file" : "files"}
            <span className="add"> +{totals.add}</span>
            <span className="del"> −{totals.del}</span>
          </span>
        )}
      </div>
      {err ? (
        <div className="view-empty">{err}</div>
      ) : files.length === 0 ? (
        <div className="view-empty">
          <div className="empty-glyph">≡</div>
          Nothing changed vs HEAD.
        </div>
      ) : (
        <div className="diff-scroll">
          {files.map((f) => (
            <FileBlock key={f.path} file={f} />
          ))}
        </div>
      )}
    </div>
  );
}
