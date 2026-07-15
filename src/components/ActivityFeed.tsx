import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Icon } from "./ActivityBar";
import type { FileChange, IntentSource, ViewIntent } from "../lib/ipc";

export interface ActivityEntry {
  id: number;
  intent: ViewIntent;
  source: IntentSource;
  at: number;
  burst?: FileChange[];
  /** Working-tree diff patch captured at event time (diff/tree events). */
  patch?: string;
  /** Branch/HEAD label at event time. */
  head?: string;
}

function rel(ms: number): string {
  const d = (Date.now() - ms) / 1000;
  if (d < 5) return "now";
  if (d < 60) return `${Math.floor(d)}s ago`;
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  return `${Math.floor(d / 3600)}h ago`;
}

function describe(i: ViewIntent): { icon: string; label: string; sub: string } {
  switch (i.kind) {
    case "spec":
      return { icon: "specs", label: "Spec", sub: i.path.split("/").pop() || i.path };
    case "diff":
      return {
        icon: "diff",
        label: "Diff",
        sub: i.paths.length ? i.paths.map((p) => p.split("/").pop()).join(", ") : "working tree",
      };
    case "tree":
      return { icon: "changes", label: "Changes", sub: "working tree" };
    case "log":
      return { icon: "timeline", label: "Timeline", sub: "commit history" };
    case "search":
      return { icon: "search", label: "Search", sub: "" };
    default:
      return { icon: "changes", label: "View", sub: "" };
  }
}

const SOURCE_LABEL: Record<string, string> = {
  classifier: "auto",
  override: "agent",
  manual: "you",
};
const KIND_MARK: Record<string, string> = {
  created: "A",
  modified: "M",
  deleted: "D",
};

// The reactive log: every view-switch, why it happened (which files), click to replay.
export function ActivityFeed({
  history,
  onReplay,
  onClear,
}: {
  history: ActivityEntry[];
  onReplay: (entry: ActivityEntry) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState<Set<number>>(new Set());
  const toggle = (i: number) =>
    setOpen((s) => {
      const n = new Set(s);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });

  return (
    <div className="view act-view">
      <div className="view-crumb">
        <span className="crumb-label">activity · reactive log</span>
        <span className="crumb-stat">
          <span className="pill">{history.length}</span>
          {history.length > 0 && (
            <button className="act-clear" onClick={onClear}>
              clear
            </button>
          )}
        </span>
      </div>

      {history.length === 0 ? (
        <div className="view-empty">
          <div className="empty-glyph">◔</div>
          Nothing yet — edit a spec or change files and watch it stream in.
        </div>
      ) : (
        <div className="act-scroll">
          {history.map((e, idx) => {
            const d = describe(e.intent);
            const hasBurst = !!e.burst && e.burst.length > 0;
            const isOpen = open.has(idx);
            return (
              <div className="act-row" key={idx}>
                <div className="act-item">
                  <button className="act-main" onClick={() => onReplay(e)}>
                    <span className="act-rail">
                      <span className={`act-dot src-${e.source}`} />
                    </span>
                    <span className="act-ic">
                      <Icon name={d.icon} />
                    </span>
                    <span className="act-body">
                      <span className="act-line">
                        <span className="act-label">{d.label}</span>
                        {d.sub && <span className="act-sub">{d.sub}</span>}
                      </span>
                      <span className="act-meta">
                        <span className={`act-src src-${e.source}`}>{SOURCE_LABEL[e.source]}</span>
                        <span className="act-time">{rel(e.at)}</span>
                        {hasBurst && <span className="act-nfiles">{e.burst!.length} changed</span>}
                        {e.patch !== undefined && <span className="act-replay">↺ replay</span>}
                      </span>
                    </span>
                  </button>
                  {hasBurst && (
                    <button className="act-caret" title="Why?" onClick={() => toggle(idx)}>
                      {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>
                  )}
                </div>
                {isOpen && hasBurst && (
                  <div className="act-burst">
                    {e.burst!.map((f, i) => (
                      <div className="act-file" key={i}>
                        <span className={`bk bk-${f.kind}`}>{KIND_MARK[f.kind] ?? "?"}</span>
                        <span className="act-file-path">{f.path}</span>
                      </div>
                    ))}
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
