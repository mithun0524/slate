import { useMemo } from "react";
import { X } from "lucide-react";
import { parseDiff, FileBlock } from "./DiffView";
import type { ActivityEntry } from "./ActivityFeed";

function rel(ms: number): string {
  const d = (Date.now() - ms) / 1000;
  if (d < 60) return `${Math.floor(d)}s ago`;
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  return `${Math.floor(d / 3600)}h ago`;
}

// Read-only replay of the working-tree diff captured at a past reactive event.
export function ReplayView({
  entry,
  onClose,
}: {
  entry: ActivityEntry;
  onClose: () => void;
}) {
  const files = useMemo(() => (entry.patch ? parseDiff(entry.patch) : []), [entry.patch]);

  return (
    <div className="view replay-view">
      <div className="replay-banner">
        <span className="replay-tag">
          <span className="replay-pulse" /> Replaying
        </span>
        <span className="replay-info">
          snapshot · {rel(entry.at)}
          {entry.head ? ` · ${entry.head}` : ""}
        </span>
        <button className="replay-exit" onClick={onClose}>
          Exit <X size={13} />
        </button>
      </div>
      {files.length === 0 ? (
        <div className="view-empty">No changes in this snapshot.</div>
      ) : (
        <div className="diff-scroll unified">
          {files.map((f) => (
            <FileBlock key={f.path} file={f} mode="unified" />
          ))}
        </div>
      )}
    </div>
  );
}
