import { useEffect, useState } from "react";
import { agentRunning, gitHeadInfo, gitTree, type HeadInfo } from "../lib/ipc";
import type { IntentSource } from "../lib/ipc";
import { GitBranch } from "lucide-react";

type Source = IntentSource | "manual";

// Bottom chrome — Cursor-style: branch + sync + changes | source · pin · theme · encoding.
export function StatusBar({
  refreshKey,
  isRepo,
  source,
  pinned,
  onPin,
  cwd,
  themeLabel,
  onTheme,
  onSettings,
}: {
  refreshKey: number;
  isRepo: boolean;
  source: Source;
  pinned: boolean;
  onPin: () => void;
  cwd: string;
  themeLabel: string;
  onTheme: () => void;
  onSettings: () => void;
}) {
  const [head, setHead] = useState<HeadInfo>({ branch: "", ahead: 0, behind: 0 });
  const [changes, setChanges] = useState(0);
  const [agent, setAgent] = useState(false);

  // Poll for a running agent (Claude Code) under the terminal.
  useEffect(() => {
    let alive = true;
    const tick = () =>
      agentRunning()
        .then((r) => alive && setAgent(r))
        .catch(() => {});
    tick();
    const id = window.setInterval(tick, 4000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (!isRepo) {
      setHead({ branch: "", ahead: 0, behind: 0 });
      setChanges(0);
      return;
    }
    let alive = true;
    gitHeadInfo()
      .then((h) => alive && setHead(h))
      .catch(() => {});
    gitTree()
      .then((t) => alive && setChanges(t.length))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [refreshKey, isRepo]);

  const dir = cwd.split("/").filter(Boolean).pop() || "/";

  return (
    <div className="status-bar">
      <div className="sb-left">
        {isRepo ? (
          <>
            <span className="sb-item" title="Current branch">
              <GitBranch size={12} />
              {head.branch || "—"}
              {(head.ahead > 0 || head.behind > 0) && (
                <span className="sb-sync">
                  {head.behind > 0 && <span>{head.behind}↓</span>}
                  {head.ahead > 0 && <span>{head.ahead}↑</span>}
                </span>
              )}
            </span>
            <span className="sb-item" title="Changed files">
              ● {changes}
            </span>
          </>
        ) : (
          <span className="sb-item warn">not a git repo</span>
        )}
        {agent && (
          <span className="sb-item agent" title="Claude Code is running">
            <span className="agent-dot" />
            agent
          </span>
        )}
      </div>
      <div className="sb-right">
        <span className={`sb-item src-${source}`} title={`view source: ${source}`}>
          <span className="dot" />
          {source}
        </span>
        <button
          className={`sb-item btn ${pinned ? "on" : ""}`}
          onClick={onPin}
          title={pinned ? "Unpin — resume auto-switching" : "Pin this view"}
        >
          {pinned ? "◆ pinned" : "◇ pin"}
        </button>
        <button className="sb-item btn" onClick={onTheme} title="Switch theme">
          {themeLabel}
        </button>
        <button className="sb-item btn sb-gear" onClick={onSettings} title="Settings">
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
            <circle cx="8" cy="8" r="2" />
            <path d="M8 1.5v1.6M8 12.9v1.6M14.5 8h-1.6M3.1 8H1.5m11-4.6l-1.1 1.1M4.6 11.4l-1.1 1.1m0-8l1.1 1.1m6.8 6.8l1.1 1.1" strokeLinecap="round" />
          </svg>
        </button>
        <span className="sb-item" title="Line endings">
          LF
        </span>
        <span className="sb-item" title="Encoding">
          UTF-8
        </span>
        <span className="sb-item" title={cwd}>
          {dir}
        </span>
      </div>
    </div>
  );
}
