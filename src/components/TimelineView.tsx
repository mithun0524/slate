import { useEffect, useMemo, useState } from "react";
import { gitCommitDiff, gitLog, type CommitInfo } from "../lib/ipc";
import { FileBlock, parseDiff } from "./DiffView";

function rel(secs: number): string {
  const d = Date.now() / 1000 - secs;
  if (d < 60) return "just now";
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
  if (d < 2592000) return `${Math.floor(d / 86400)}d ago`;
  return new Date(secs * 1000).toLocaleDateString();
}

function CommitDiff({ hash }: { hash: string }) {
  const [patch, setPatch] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    gitCommitDiff(hash)
      .then((p) => alive && setPatch(p))
      .catch(() => alive && setPatch(""));
    return () => {
      alive = false;
    };
  }, [hash]);
  const files = useMemo(() => (patch ? parseDiff(patch) : []), [patch]);
  if (patch === null) return <div className="commit-loading">loading diff…</div>;
  if (files.length === 0)
    return <div className="commit-loading">No textual changes.</div>;
  return (
    <div className="commit-diff">
      {files.map((f) => (
        <FileBlock key={f.path} file={f} mode="unified" />
      ))}
    </div>
  );
}

// Pane B / timeline: vertical commit history; click a commit to expand its diff.
export function TimelineView({ refreshKey }: { refreshKey: number }) {
  // null = first load pending; [] would flash "No commits yet." for a frame.
  const [commits, setCommits] = useState<CommitInfo[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    gitLog(80)
      .then((c) => alive && (setCommits(c), setErr(null)))
      .catch((e) => alive && setErr(String(e)));
    return () => {
      alive = false;
    };
  }, [refreshKey]);

  if (commits === null && !err) return null;

  return (
    <div className="view timeline-view">
      <div className="view-crumb">
        <span className="crumb-label">timeline · commits</span>
        {(commits?.length ?? 0) > 0 && (
          <span className="crumb-stat">
            <span className="pill">{commits?.length}</span>
          </span>
        )}
      </div>
      {err ? (
        <div className="view-empty">
          <div className="empty-glyph">⎇</div>
          {/could not find repository|NotFound|class=Repository/i.test(err)
            ? "Not a git repository."
            : err}
        </div>
      ) : commits?.length === 0 ? (
        <div className="view-empty">
          <div className="empty-glyph">◷</div>
          No commits yet.
        </div>
      ) : (
        <div className="tl-scroll">
          {(commits ?? []).map((c) => {
            const isOpen = open === c.hash;
            return (
              <div className={`tl-item ${isOpen ? "open" : ""}`} key={c.hash}>
                <button
                  className="tl-row"
                  onClick={() => setOpen(isOpen ? null : c.hash)}
                >
                  <span className="tl-rail">
                    <span className="tl-dot" />
                  </span>
                  <span className="tl-body">
                    <span className="tl-summary">{c.summary || "(no message)"}</span>
                    <span className="tl-meta">
                      <span className="tl-hash">{c.short}</span>
                      <span className="tl-author">{c.author}</span>
                      <span className="tl-time">{rel(c.time)}</span>
                    </span>
                  </span>
                </button>
                {isOpen && (
                  <div className="tl-expand">
                    <CommitDiff hash={c.hash} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
