import { useEffect, useState } from "react";
import { gitTree, type TreeEntry } from "../lib/ipc";

// A node in the assembled directory tree.
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
        next = {
          name: part,
          path: parts.slice(0, i + 1).join("/"),
          children: new Map(),
        };
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
  new: "A",
  untracked: "?",
  modified: "M",
  deleted: "D",
  renamed: "R",
  typechange: "T",
  conflicted: "!",
  clean: "",
};

function NodeRow({
  node,
  depth,
  onSelect,
}: {
  node: Node;
  depth: number;
  onSelect: (path: string) => void;
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
          className={`tree-row ${node.status ? `st-${node.status}` : ""}`}
          style={{ paddingLeft: 8 + depth * 14 }}
          onClick={() => !isDir && onSelect(node.path)}
        >
          <span className="tree-glyph">{isDir ? "▸" : "•"}</span>
          <span className="tree-name">{node.name}</span>
          {node.status && node.status !== "clean" && (
            <span className={`tree-mark st-${node.status}`}>
              {node.staged ? "●" : ""}
              {STATUS_MARK[node.status] ?? "?"}
            </span>
          )}
        </div>
      )}
      {kids.map((k) => (
        <NodeRow key={k.path} node={k} depth={node.name ? depth + 1 : depth} onSelect={onSelect} />
      ))}
    </>
  );
}

// Pane B / tree view: git-status-colored source tree. `refreshKey` changes to
// force a re-fetch (bumped whenever a tree intent arrives).
export function TreeView({
  refreshKey,
  onSelect,
}: {
  refreshKey: number;
  onSelect: (path: string) => void;
}) {
  const [tree, setTree] = useState<Node | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    gitTree()
      .then((entries) => {
        if (!alive) return;
        setTree(buildTree(entries));
        setErr(null);
      })
      .catch((e) => alive && setErr(String(e)));
    return () => {
      alive = false;
    };
  }, [refreshKey]);

  return (
    <div className="view tree-view">
      <div className="view-crumb">source tree · changed files</div>
      {err ? (
        <div className="view-empty">{err}</div>
      ) : tree && tree.children.size > 0 ? (
        <div className="tree-scroll">
          <NodeRow node={tree} depth={0} onSelect={onSelect} />
        </div>
      ) : (
        <div className="view-empty">Working tree clean — no changes.</div>
      )}
    </div>
  );
}
