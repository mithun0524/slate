import { useEffect, useMemo, useState } from "react";
import {
  gitBranch,
  gitBranches,
  gitCheckout,
  gitCommit,
  gitDiscard,
  gitFetch,
  gitPull,
  gitPush,
  gitStage,
  gitStashList,
  gitStashPop,
  gitStashPush,
  gitTree,
  gitUnstage,
  type BranchInfo,
  type StashEntry,
  type TreeEntry,
} from "../lib/ipc";
import { FileIcon } from "./FileIcon";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Check,
  ChevronDown,
  FileDiff,
  GitBranch,
  Inbox,
  Minus,
  Plus,
  RefreshCw,
  Undo2,
} from "lucide-react";

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
  // null = first load pending; [] would flash the "No changes." empty state.
  const [entries, setEntries] = useState<TreeEntry[] | null>(null);
  const [branch, setBranch] = useState("");
  const [msg, setMsg] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  const [pending, setPending] = useState<string[] | null>(null);

  const [branchMenu, setBranchMenu] = useState(false);
  const [branchList, setBranchList] = useState<BranchInfo[]>([]);
  const [newBranch, setNewBranch] = useState("");
  const [stashes, setStashes] = useState<StashEntry[]>([]);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    gitTree()
      .then((e) => alive && (setEntries(e), setErr(null)))
      .catch((e) => alive && setErr(String(e)));
    gitBranch()
      .then((b) => alive && setBranch(b))
      .catch(() => {});
    gitStashList()
      .then((s) => alive && setStashes(s))
      .catch(() => alive && setStashes([]));
    return () => {
      alive = false;
    };
  }, [refreshKey]);

  // Branch list is only needed when the switcher is open.
  useEffect(() => {
    if (!branchMenu) return;
    let alive = true;
    gitBranches()
      .then((b) => alive && setBranchList(b))
      .catch((e) => alive && setNote(String(e)));
    return () => {
      alive = false;
    };
  }, [branchMenu, refreshKey]);

  /// Run a git operation that talks to the network or rewrites the worktree:
  /// one at a time, report what happened, refresh everything after.
  const op = async (label: string, fn: () => Promise<string>) => {
    if (busy) return;
    setBusy(label);
    setNote(`${label}…`);
    try {
      const out = await fn();
      setNote(out.split("\n").slice(-1)[0] || `${label} done`);
      onChanged();
    } catch (e) {
      setNote(String(e).split("\n").slice(0, 2).join(" "));
    } finally {
      setBusy(null);
    }
  };

  const switchTo = (name: string, create: boolean) => {
    setBranchMenu(false);
    setNewBranch("");
    op(create ? `creating ${name}` : `switching to ${name}`, () => gitCheckout(name, create));
  };

  const staged = useMemo(() => (entries ?? []).filter((e) => e.staged), [entries]);
  const unstaged = useMemo(() => (entries ?? []).filter((e) => !e.staged), [entries]);

  const run = (p: Promise<unknown>) =>
    p.then(() => onChanged()).catch((e) => setNote(String(e)));

  const stage = (paths: string[]) => paths.length && run(gitStage(paths));
  const unstage = (paths: string[]) => paths.length && run(gitUnstage(paths));
  // In-app confirm bar rather than window.confirm — a native OS sheet in a
  // custom-chrome window is the most jarring thing in the app.
  const discard = (paths: string[]) => paths.length && setPending(paths);

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

  const canCommit = msg.trim().length > 0 && (entries?.length ?? 0) > 0;

  if (entries === null && !err) return null; // don't flash "No changes." before the first load

  return (
    <div className="view scm-view">
      <div className="view-crumb">
        <span className="crumb-label">source control</span>
        <span className="crumb-stat scm-bar">
          {branch && (
            <span className="scm-branch-wrap">
              <button
                className="pill scm-branch"
                title="Switch branch"
                onClick={() => setBranchMenu((v) => !v)}
              >
                <GitBranch size={11} /> {branch}
                <ChevronDown size={11} />
              </button>
              {branchMenu && (
                <div className="scm-branch-menu" onMouseLeave={() => setBranchMenu(false)}>
                  <input
                    className="scm-branch-new"
                    placeholder="New branch from HEAD…"
                    value={newBranch}
                    onChange={(e) => setNewBranch(e.currentTarget.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && newBranch.trim() && switchTo(newBranch.trim(), true)
                    }
                  />
                  <div className="scm-branch-list">
                    {branchList.map((b) => (
                      <button
                        key={b.name}
                        className={`scm-branch-item ${b.current ? "on" : ""}`}
                        disabled={b.current}
                        onClick={() => switchTo(b.name, false)}
                      >
                        {b.current ? <Check size={13} /> : <GitBranch size={13} />}
                        <span className="scm-branch-name">{b.name}</span>
                        {b.upstream ? (
                          <span className="scm-branch-up">{b.upstream}</span>
                        ) : (
                          <span className="scm-branch-up dim">local</span>
                        )}
                      </button>
                    ))}
                    {branchList.length === 0 && <div className="scm-branch-empty">no branches</div>}
                  </div>
                </div>
              )}
            </span>
          )}

          <button
            className="scm-act"
            title="Fetch"
            disabled={!!busy}
            onClick={() => op("fetching", gitFetch)}
          >
            <RefreshCw size={14} />
          </button>
          <button
            className="scm-act"
            title="Pull (fast-forward only)"
            disabled={!!busy}
            onClick={() => op("pulling", gitPull)}
          >
            <ArrowDownToLine size={14} />
          </button>
          <button
            className="scm-act"
            title="Push"
            disabled={!!busy}
            onClick={() => op("pushing", gitPush)}
          >
            <ArrowUpFromLine size={14} />
          </button>
          <button
            className="scm-act"
            title={stashes.length ? `Pop latest stash (${stashes.length})` : "Stash all changes"}
            disabled={!!busy || (!stashes.length && !(entries?.length ?? 0))}
            onClick={() =>
              stashes.length
                ? op("popping stash", () => gitStashPop(0))
                : op("stashing", () => gitStashPush(msg.trim()))
            }
          >
            <Inbox size={14} />
            {stashes.length > 0 && <span className="scm-stash-count">{stashes.length}</span>}
          </button>
        </span>
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
            <ChevronDown size={15} />
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

      {pending && (
        <div className="scm-confirm">
          <span>
            Discard changes to{" "}
            <strong>{pending.length === 1 ? pending[0] : `${pending.length} files`}</strong>? This
            cannot be undone.
          </span>
          <button className="scm-confirm-no" onClick={() => setPending(null)}>
            Cancel
          </button>
          <button
            className="scm-confirm-yes"
            onClick={() => {
              const paths = pending;
              setPending(null);
              run(gitDiscard(paths));
            }}
          >
            Discard
          </button>
        </div>
      )}

      {err ? (
        <div className="view-empty">
          <div className="empty-glyph">⎇</div>
          {/could not find repository|NotFound|class=Repository/i.test(err)
            ? "Not a git repository."
            : err}
        </div>
      ) : entries?.length === 0 ? (
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
