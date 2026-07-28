import { useEffect, useMemo, useState } from "react";
import { gitDiff } from "../lib/ipc";
import { FileView } from "./FileView";
import { ChevronDown, ChevronRight } from "lucide-react";

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
type Mode = "unified" | "split";
interface Part {
  text: string;
  changed: boolean;
}

// ---- unified-diff parser ----
export function parseDiff(patch: string): FileDiff[] {
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
      file = { path: m ? m[1] : line, hunks: [], additions: 0, deletions: 0, binary: false };
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
    if (
      line.startsWith("index ") ||
      line.startsWith("new file") ||
      line.startsWith("deleted file") ||
      line.startsWith("rename ") ||
      line.startsWith("similarity ")
    )
      continue;
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
    // The split on "\n" leaves a trailing "" for the final newline, and git
    // emits "\ No newline at end of file" — neither is a diff line. Without
    // this they render as a blank context row and bump the line numbers. A
    // genuinely empty source line arrives as " ", not "".
    if (line === "" || line.startsWith("\\ ")) continue;
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

// ---- word-level diff (token LCS) ----
function tokenize(s: string): string[] {
  return s.match(/(\w+|\s+|[^\w\s])/g) || [];
}
function wordDiff(oldS: string, newS: string): { oldParts: Part[]; newParts: Part[] } {
  const a = tokenize(oldS);
  const b = tokenize(newS);
  const n = a.length;
  const m = b.length;
  // Bail on pathologically long lines — whole line marked changed.
  if (n * m > 6000) {
    return {
      oldParts: [{ text: oldS, changed: true }],
      newParts: [{ text: newS, changed: true }],
    };
  }
  const dp: Int32Array[] = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i--)
    for (let j = m - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const oldParts: Part[] = [];
  const newParts: Part[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      oldParts.push({ text: a[i], changed: false });
      newParts.push({ text: b[j], changed: false });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      oldParts.push({ text: a[i++], changed: true });
    } else {
      newParts.push({ text: b[j++], changed: true });
    }
  }
  while (i < n) oldParts.push({ text: a[i++], changed: true });
  while (j < m) newParts.push({ text: b[j++], changed: true });
  return { oldParts, newParts };
}

// Group a hunk's lines into context lines and del/add change-blocks.
type Block =
  | { kind: "ctx"; line: DiffLine }
  | { kind: "change"; dels: DiffLine[]; adds: DiffLine[]; wd: ReturnType<typeof wordDiff>[] };

function blocks(lines: DiffLine[]): Block[] {
  const out: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    if (lines[i].type === "ctx") {
      out.push({ kind: "ctx", line: lines[i] });
      i++;
      continue;
    }
    const dels: DiffLine[] = [];
    while (i < lines.length && lines[i].type === "del") dels.push(lines[i++]);
    const adds: DiffLine[] = [];
    while (i < lines.length && lines[i].type === "add") adds.push(lines[i++]);
    const wd: ReturnType<typeof wordDiff>[] = [];
    const pairs = Math.min(dels.length, adds.length);
    for (let k = 0; k < pairs; k++) wd.push(wordDiff(dels[k].text, adds[k].text));
    out.push({ kind: "change", dels, adds, wd });
  }
  return out;
}

function Code({ text, parts, kind }: { text: string; parts?: Part[]; kind?: "del" | "add" }) {
  if (!parts) return <span className="code">{text || " "}</span>;
  return (
    <span className="code">
      {parts.map((p, i) =>
        p.changed ? (
          <span key={i} className={`wl wl-${kind}`}>
            {p.text}
          </span>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </span>
  );
}

function UnifiedRow({ l, parts }: { l: DiffLine; parts?: Part[] }) {
  return (
    <div className={`dline ${l.type}`}>
      <span className="gutter old">{l.oldNo ?? ""}</span>
      <span className="gutter new">{l.newNo ?? ""}</span>
      <span className="sign">{l.type === "add" ? "+" : l.type === "del" ? "−" : ""}</span>
      <Code text={l.text} parts={parts} kind={l.type === "del" ? "del" : "add"} />
    </div>
  );
}

function HunkUnified({ h }: { h: Hunk }) {
  const bs = useMemo(() => blocks(h.lines), [h]);
  return (
    <>
      {bs.map((b, bi) =>
        b.kind === "ctx" ? (
          <UnifiedRow key={bi} l={b.line} />
        ) : (
          <div key={bi}>
            {b.dels.map((d, k) => (
              <UnifiedRow key={`d${k}`} l={d} parts={b.wd[k]?.oldParts} />
            ))}
            {b.adds.map((a, k) => (
              <UnifiedRow key={`a${k}`} l={a} parts={b.wd[k]?.newParts} />
            ))}
          </div>
        ),
      )}
    </>
  );
}

function SplitSide({ l, parts }: { l: DiffLine | null; parts?: Part[] }) {
  if (!l) return <div className="dline empty" />;
  const no = l.type === "del" ? l.oldNo : l.type === "add" ? l.newNo : l.newNo;
  return (
    <div className={`dline ${l.type}`}>
      <span className="gutter">{no ?? ""}</span>
      <span className="sign">{l.type === "add" ? "+" : l.type === "del" ? "−" : ""}</span>
      <Code text={l.text} parts={parts} kind={l.type === "del" ? "del" : "add"} />
    </div>
  );
}

function HunkSplit({ h }: { h: Hunk }) {
  const bs = useMemo(() => blocks(h.lines), [h]);
  const rows: Array<{ left: DiffLine | null; right: DiffLine | null; lp?: Part[]; rp?: Part[] }> = [];
  for (const b of bs) {
    if (b.kind === "ctx") {
      rows.push({ left: b.line, right: b.line });
    } else {
      const max = Math.max(b.dels.length, b.adds.length);
      for (let k = 0; k < max; k++) {
        rows.push({
          left: b.dels[k] ?? null,
          right: b.adds[k] ?? null,
          lp: b.wd[k]?.oldParts,
          rp: b.wd[k]?.newParts,
        });
      }
    }
  }
  return (
    <div className="split-grid">
      {rows.map((r, i) => (
        <div className="split-row" key={i}>
          <SplitSide l={r.left} parts={r.lp} />
          <SplitSide l={r.right} parts={r.rp} />
        </div>
      ))}
    </div>
  );
}

export function FileBlock({ file, mode }: { file: FileDiff; mode: Mode }) {
  const [open, setOpen] = useState(true);
  const name = file.path.split("/").pop();
  const dir = file.path.split("/").slice(0, -1).join("/");
  return (
    <div className="dfile">
      <button className="dfile-head" onClick={() => setOpen((v) => !v)}>
        {open ? (
          <ChevronDown size={14} className="tree-chevron" />
        ) : (
          <ChevronRight size={14} className="tree-chevron" />
        )}
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
                {mode === "unified" ? <HunkUnified h={h} /> : <HunkSplit h={h} />}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function DiffView({ paths, refreshKey }: { paths: string[]; refreshKey: number }) {
  // null = not loaded yet. Rendering "" would flash "nothing changed" for a
  // frame before the real patch lands.
  const [patch, setPatch] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("unified");

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

  const files = useMemo(() => parseDiff(patch ?? ""), [patch]);
  const totals = useMemo(
    () =>
      files.reduce((a, f) => ({ add: a.add + f.additions, del: a.del + f.deletions }), {
        add: 0,
        del: 0,
      }),
    [files],
  );

  if (patch === null && !err) return null; // mount (and fade in) once there's something to show

  return (
    <div className="view diff-view">
      <div className="view-crumb">
        <span className="crumb-label">
          diff · {paths.length ? paths.join(", ") : "working tree"}
        </span>
        <span className="crumb-stat">
          {files.length > 0 && (
            <>
              {files.length} {files.length === 1 ? "file" : "files"}
              <span className="add"> +{totals.add}</span>
              <span className="del"> −{totals.del}</span>
            </>
          )}
          <span className="mini-seg">
            <button
              className={mode === "unified" ? "on" : ""}
              onClick={() => setMode("unified")}
            >
              unified
            </button>
            <button
              className={mode === "split" ? "on" : ""}
              onClick={() => setMode("split")}
            >
              split
            </button>
          </span>
        </span>
      </div>
      {err ? (
        <div className="view-empty">
          <div className="empty-glyph">⎇</div>
          {/could not find repository|NotFound|class=Repository/i.test(err)
            ? "Not a git repository."
            : err}
        </div>
      ) : files.length === 0 && paths.length === 1 ? (
        // A single file with no diff (already committed, or opened from search
        // / the palette) used to dead-end on "nothing changed" — show it.
        <FileView path={paths[0]} crumb={false} />
      ) : files.length === 0 ? (
        <div className="view-empty">
          <div className="empty-glyph">≡</div>
          Nothing changed vs HEAD.
        </div>
      ) : (
        <div className={`diff-scroll ${mode}`}>
          {files.map((f) => (
            <FileBlock key={f.path} file={f} mode={mode} />
          ))}
        </div>
      )}
    </div>
  );
}
