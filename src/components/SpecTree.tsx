import { useEffect, useMemo, useState } from "react";
import { listSpecs } from "../lib/ipc";
import { FileIcon } from "./FileIcon";

interface Node {
  name: string;
  path: string;
  isDir: boolean;
  children: Map<string, Node>;
}

function build(paths: string[]): Node {
  const root: Node = { name: "", path: "", isDir: true, children: new Map() };
  for (const p of paths) {
    const parts = p.split("/").filter(Boolean);
    let cur = root;
    parts.forEach((part, i) => {
      const isLast = i === parts.length - 1;
      let next = cur.children.get(part);
      if (!next) {
        next = {
          name: part,
          path: parts.slice(0, i + 1).join("/"),
          isDir: !isLast,
          children: new Map(),
        };
        cur.children.set(part, next);
      }
      cur = next;
    });
  }
  return root;
}

function Row({
  node,
  depth,
  active,
  collapsed,
  toggle,
  onSelect,
}: {
  node: Node;
  depth: number;
  active: string;
  collapsed: Set<string>;
  toggle: (p: string) => void;
  onSelect: (p: string) => void;
}) {
  const kids = [...node.children.values()].sort((a, b) => {
    return (a.isDir ? 0 : 1) - (b.isDir ? 0 : 1) || a.name.localeCompare(b.name);
  });
  const isOpen = node.isDir && !collapsed.has(node.path);

  return (
    <>
      {node.name &&
        (node.isDir ? (
          <div
            className="spec-row dir"
            style={{ paddingLeft: 8 + depth * 14 }}
            onClick={() => toggle(node.path)}
          >
            <span className={`chev ${isOpen ? "open" : ""}`}>▸</span>
            <FileIcon name={node.name} dir open={isOpen} />
            <span className="spec-folder">{node.name}</span>
          </div>
        ) : (
          <div
            className={`spec-row file ${active === node.path ? "active" : ""}`}
            style={{ paddingLeft: 8 + depth * 14 }}
            onClick={() => onSelect(node.path)}
            title={node.path}
          >
            <FileIcon name={node.name} />
            <span className="spec-name">{node.name}</span>
          </div>
        ))}
      {(!node.name || isOpen) &&
        kids.map((k) => (
          <Row
            key={k.path}
            node={k}
            depth={node.name ? depth + 1 : depth}
            active={active}
            collapsed={collapsed}
            toggle={toggle}
            onSelect={onSelect}
          />
        ))}
    </>
  );
}

// Sidebar tree of every markdown file in the repo — the spec switcher.
export function SpecTree({
  active,
  refreshKey,
  onSelect,
}: {
  active: string;
  refreshKey: number;
  onSelect: (path: string) => void;
}) {
  const [paths, setPaths] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  useEffect(() => {
    let alive = true;
    listSpecs()
      .then((p) => alive && setPaths(p))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [refreshKey]);

  const tree = useMemo(() => build(paths), [paths]);
  const toggle = (p: string) =>
    setCollapsed((s) => {
      const n = new Set(s);
      n.has(p) ? n.delete(p) : n.add(p);
      return n;
    });

  return (
    <div className="spec-tree">
      <div className="spec-tree-head">
        specs<span className="spec-count">{paths.length}</span>
      </div>
      <div className="spec-tree-scroll">
        {paths.length === 0 ? (
          <div className="spec-tree-empty">No markdown files.</div>
        ) : (
          <Row
            node={tree}
            depth={0}
            active={active}
            collapsed={collapsed}
            toggle={toggle}
            onSelect={onSelect}
          />
        )}
      </div>
    </div>
  );
}
