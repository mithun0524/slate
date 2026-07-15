import { useEffect, useMemo, useState } from "react";
import {
  gitBranch,
  gitCommit,
  gitDiscard,
  gitStage,
  gitTree,
  gitUnstage,
  type TreeEntry,
} from "../lib/ipc";
import { FileIcon } from "./FileIcon";
import { ChevronDown, FileDiff, GitBranch, Minus, Plus, Undo2 } from "lucide-react";

const LETTER: Record<string, string> = {
  new: "A",
  untracked: "U",
  modified: "M",
  deleted: "D",
  renamed: "R",
  typechange: "T",
  conflicted: "!",
  clean: "",
};

function Row({
  e,
  onSelect,
  onStage,
  onUnstage,
  onDiscard,
}: {
  e: TreeEntry;
  onSelect: (p: string) => void;
  onStage?: (p: string) => void;
  onUnstage?: (p: string) => void;
  onDiscard?: (p: string) => void;
}) {
  const base = e.path.split("/").pop() || e.path;
  const dir = e.path.split("/").slice(0, -1).join("/");
  return (
    <div className={`scm-row st-${e.status}`} onClick={() => onSelect(e.path)} title={e.path}>
      <FileIcon name={base} />
      <span className="scm-name">{base}</span>
      <span className="scm-dir">{dir}</span>
      <span className="scm-actions" onClick={(ev) => ev.stopPropagation()}>
        <button className="scm-act" title="Open changes" onClick={() => onSelect(e.path)}>
          <FileDiff size={15} />
        </button>
        {onDiscard && (
          <button className="scm-act" title="Discard changes" onClick={() => onDiscard(e.path)}>
            <Undo2 size={15} />
          </button>
        )}
        {onStage && (
          <button className="scm-act" title="Stage changes" onClick={() => onStage(e.path)}>
            <Plus size={15} />
          </button>
        )}
        {onUnstage && (
          <button className="scm-act" title="Unstage changes" onClick={() => onUnstage(e.path)}>
            <Minus size={15} />
          </button>
        )}
      </span>
      <span className={`scm-status st-${e.status}`}>{LETTER[e.status] ?? "?"}</span>
    </div>
  );
}

// Full Source Control panel (VS Code / Cursor style): commit box, staged +
// unstaged sections with per-file and bulk stage / unstage / discard.
export function SourceControl({
  refreshKey,
  onSelect,
  onChanged,
}: {
  refreshKey: number;
  onSelect: (p: string) => void;
  onChanged: () => void;
}) {
  const [entries, setEntries] = useState<TreeEntry[]>([]);
  const [branch, setBranch] = useState("");
  const [msg, setMsg] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    let alive = true;
    gitTree()
      .then((e) => alive && (setEntries(e), setErr(null)))
      .catch((e) => alive && setErr(String(e)));
    gitBranch()
      .then((b) => alive && setBranch(b))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [refreshKey]);

  const staged = useMemo(() => entries.filter((e) => e.staged), [entries]);
  const unstaged = useMemo(() => entries.filter((e) => !e.staged), [entries]);

  const run = (p: Promise<unknown>) =>
    p.then(() => onChanged()).catch((e) => setNote(String(e)));

  const stage = (paths: string[]) => paths.length && run(gitStage(paths));
  const unstage = (paths: string[]) => paths.length && run(gitUnstage(paths));
  const discard = (paths: string[]) => {
    if (!paths.length) return;
    const what = paths.length === 1 ? paths[0] : `${paths.length} files`;
    if (!window.confirm(`Discard changes to ${what}? This cannot be undone.`)) return;
    run(gitDiscard(paths));
  };

  const doCommit = async () => {
    if (!msg.trim()) return;
    try {
      if (staged.length === 0) {
        if (!unstaged.length) return;
        await gitStage(unstaged.map((e) => e.path));
      }
      const hash = await gitCommit(msg.trim());
      setMsg("");
      setNote(`committed ${hash}`);
      onChanged();
    } catch (e) {
      setNote(String(e));
    }
  };

  const canCommit = msg.trim().length > 0 && entries.length > 0;

  return (
    <div className="view scm-view">
      <div className="view-crumb">
        <span className="crumb-label">source control</span>
        {branch && (
          <span className="crumb-stat">
            <span className="pill scm-branch">
              <GitBranch size={11} /> {branch}
            </span>
          </span>
        )}
      </div>

      <div className="scm-commit">
        <input
          className="scm-msg"
          placeholder={`Message (⌘↵ to commit${branch ? ` on '${branch}'` : ""})`}
          value={msg}
          onChange={(e) => setMsg(e.currentTarget.value)}
          onKeyDown={(e) => (e.metaKey || e.ctrlKey) && e.key === "Enter" && doCommit()}
        />
        <div className="scm-commit-btn">
          <button className="scm-commit-main" onClick={doCommit} disabled={!canCommit}>
            ✓ Commit
          </button>
          <button className="scm-commit-more" onClick={() => setMenu((v) => !v)}>
            ⌄
          </button>
          {menu && (
            <div className="scm-menu" onMouseLeave={() => setMenu(false)}>
              <button
                onClick={() => {
                  setMenu(false);
                  stage(unstaged.map((e) => e.path));
                }}
                disabled={!unstaged.length}
              >
                Stage all changes
              </button>
              <button
                onClick={() => {
                  setMenu(false);
                  discard(unstaged.map((e) => e.path));
                }}
                disabled={!unstaged.length}
              >
                Discard all changes
              </button>
            </div>
          )}
        </div>
      </div>
      {note && <div className="commit-note">{note}</div>}

      {err ? (
        <div className="view-empty">{err}</div>
      ) : entries.length === 0 ? (
        <div className="view-empty">
          <div className="empty-glyph">✓</div>
          No changes.
        </div>
      ) : (
        <div className="scm-scroll">
          {staged.length > 0 && (
            <div className="scm-section">
              <div className="scm-section-head">
                <ChevronDown size={15} className="scm-chev" />
                <span className="scm-section-title">Staged Changes</span>
                <span className="scm-section-actions" onClick={(e) => e.stopPropagation()}>
                  <button className="scm-act" title="Unstage all" onClick={() => unstage(staged.map((e) => e.path))}>
                    <Minus size={15} />
                  </button>
                </span>
                <span className="scm-count">{staged.length}</span>
              </div>
              {staged.map((e) => (
                <Row key={e.path} e={e} onSelect={onSelect} onUnstage={(p) => unstage([p])} />
              ))}
            </div>
          )}

          {unstaged.length > 0 && (
            <div className="scm-section">
              <div className="scm-section-head">
                <ChevronDown size={15} className="scm-chev" />
                <span className="scm-section-title">Changes</span>
                <span className="scm-section-actions" onClick={(e) => e.stopPropagation()}>
                  <button className="scm-act" title="Discard all" onClick={() => discard(unstaged.map((e) => e.path))}>
                    <Undo2 size={15} />
                  </button>
                  <button className="scm-act" title="Stage all" onClick={() => stage(unstaged.map((e) => e.path))}>
                    <Plus size={15} />
                  </button>
                </span>
                <span className="scm-count">{unstaged.length}</span>
              </div>
              {unstaged.map((e) => (
                <Row
                  key={e.path}
                  e={e}
                  onSelect={onSelect}
                  onStage={(p) => stage([p])}
                  onDiscard={(p) => discard([p])}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
