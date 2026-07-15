import { useEffect, useState } from "react";
import { gitHeadInfo, gitTree, type HeadInfo } from "../lib/ipc";
import type { IntentSource } from "../lib/ipc";

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
}: {
  refreshKey: number;
  isRepo: boolean;
  source: Source;
  pinned: boolean;
  onPin: () => void;
  cwd: string;
  themeLabel: string;
  onTheme: () => void;
}) {
  const [head, setHead] = useState<HeadInfo>({ branch: "", ahead: 0, behind: 0 });
  const [changes, setChanges] = useState(0);

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
              <span className="sb-glyph">⎇</span>
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
