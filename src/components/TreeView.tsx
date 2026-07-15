import { useEffect, useMemo, useState } from "react";
import { gitCommit, gitStage, gitTree, gitUnstage, type TreeEntry } from "../lib/ipc";
import { FileIcon } from "./FileIcon";

interface Node {
  name: string;
  path: string;
  status?: string;
  staged?: boolean;
  children: Map<string, Node>;
}

function buildTree(entries: TreeEntry[]): Node {
  const root: Node = { name: "", path: "", children: new Map() };
  for (const e of entries) {
    const parts = e.path.split("/").filter(Boolean);
    let cur = root;
    parts.forEach((part, i) => {
      let next = cur.children.get(part);
      if (!next) {
        next = { name: part, path: parts.slice(0, i + 1).join("/"), children: new Map() };
        cur.children.set(part, next);
      }
      cur = next;
    });
    cur.status = e.status;
    cur.staged = e.staged;
  }
  return root;
}

const STATUS_MARK: Record<string, string> = {
  new: "A", untracked: "U", modified: "M", deleted: "D",
  renamed: "R", typechange: "T", conflicted: "!", clean: "",
};

function NodeRow({
  node,
  depth,
  onSelect,
  onToggleStage,
}: {
  node: Node;
  depth: number;
  onSelect: (path: string) => void;
  onToggleStage: (path: string, staged: boolean) => void;
}) {
  const isDir = node.children.size > 0;
  const kids = [...node.children.values()].sort((a, b) => {
    const ad = a.children.size > 0 ? 0 : 1;
    const bd = b.children.size > 0 ? 0 : 1;
    return ad - bd || a.name.localeCompare(b.name);
  });

  return (
    <>
      {node.name && (
        <div
          className={`tree-row ${isDir ? "is-dir" : ""} ${node.status ? `st-${node.status}` : ""}`}
          style={{ paddingLeft: 10 + depth * 15 }}
          onClick={() => !isDir && onSelect(node.path)}
        >
          {isDir && <span className="tree-glyph">▾</span>}
          <FileIcon name={node.name} dir={isDir} open={isDir} />
          <span className="tree-name">{node.name}</span>
          {!isDir && node.status && node.status !== "clean" && (
            <>
              <button
                className="tree-stage"
                title={node.staged ? "Unstage" : "Stage"}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleStage(node.path, !!node.staged);
                }}
              >
                {node.staged ? "−" : "+"}
              </button>
              <span className={`tree-chip st-${node.status}`}>
                {node.staged && <span className="staged-dot" />}
                {STATUS_MARK[node.status] ?? "?"}
              </span>
            </>
          )}
        </div>
      )}
      {kids.map((k) => (
        <NodeRow
          key={k.path}
          node={k}
          depth={node.name ? depth + 1 : depth}
          onSelect={onSelect}
          onToggleStage={onToggleStage}
        />
      ))}
    </>
  );
}

export function TreeView({
  refreshKey,
  onSelect,
  onChanged,
}: {
  refreshKey: number;
  onSelect: (path: string) => void;
  onChanged: () => void;
}) {
  const [entries, setEntries] = useState<TreeEntry[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    gitTree()
      .then((e) => alive && (setEntries(e), setErr(null)))
      .catch((e) => alive && setErr(String(e)));
    return () => {
      alive = false;
    };
  }, [refreshKey]);

  const tree = useMemo(() => buildTree(entries), [entries]);
  const summary = useMemo(() => {
    const s = { staged: 0, changed: 0 };
    for (const e of entries) e.staged ? s.staged++ : s.changed++;
    return s;
  }, [entries]);

  const toggleStage = (path: string, staged: boolean) => {
    const p = staged ? gitUnstage([path]) : gitStage([path]);
    p.then(onChanged).catch((e) => setNote(String(e)));
  };
  const stageAll = () => {
    const unstaged = entries.filter((e) => !e.staged).map((e) => e.path);
    if (!unstaged.length) return;
    gitStage(unstaged).then(onChanged).catch((e) => setNote(String(e)));
  };
  const commit = () => {
    if (!msg.trim() || summary.staged === 0) return;
    gitCommit(msg.trim())
      .then((hash) => {
        setMsg("");
        setNote(`committed ${hash}`);
        onChanged();
      })
      .catch((e) => setNote(String(e)));
  };

  return (
    <div className="view tree-view">
      <div className="view-crumb">
        <span className="crumb-label">source · changes</span>
        {entries.length > 0 && (
          <span className="crumb-stat">
            {summary.staged > 0 && <span className="pill staged">{summary.staged} staged</span>}
            <span className="pill">{summary.changed} changed</span>
          </span>
        )}
      </div>

      {entries.length > 0 && (
        <div className="commit-bar">
          <input
            className="commit-input"
            placeholder="Commit message…"
            value={msg}
            onChange={(e) => setMsg(e.currentTarget.value)}
            onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === "Enter" && commit()}
          />
          <button className="commit-stageall" title="Stage all" onClick={stageAll}>
            +
          </button>
          <button
            className="commit-btn"
            onClick={commit}
            disabled={!msg.trim() || summary.staged === 0}
            title={summary.staged === 0 ? "Stage files first" : "Commit staged"}
          >
            Commit
          </button>
        </div>
      )}
      {note && <div className="commit-note">{note}</div>}

      {err ? (
        <div className="view-empty">{err}</div>
      ) : entries.length > 0 ? (
        <div className="tree-scroll">
          <NodeRow node={tree} depth={0} onSelect={onSelect} onToggleStage={toggleStage} />
        </div>
      ) : (
        <div className="view-empty">
          <div className="empty-glyph">✓</div>
          Working tree clean.
        </div>
      )}
    </div>
  );
}
