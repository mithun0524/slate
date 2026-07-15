import { Icon } from "./ActivityBar";
import type { IntentSource, ViewIntent } from "../lib/ipc";

export interface ActivityEntry {
  intent: ViewIntent;
  source: IntentSource;
  at: number;
}

function rel(ms: number): string {
  const d = (Date.now() - ms) / 1000;
  if (d < 5) return "now";
  if (d < 60) return `${Math.floor(d)}s ago`;
  if (d < 3600) return `${Math.floor(d / 60)}m ago`;
  return `${Math.floor(d / 3600)}h ago`;
}

// intent -> the ActivityBar icon name + a human label.
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

// The reactive log: every view-switch, why it happened, click to jump/replay.
export function ActivityFeed({
  history,
  onReplay,
  onClear,
}: {
  history: ActivityEntry[];
  onReplay: (intent: ViewIntent) => void;
  onClear: () => void;
}) {
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
            return (
              <button className="act-item" key={idx} onClick={() => onReplay(e.intent)}>
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
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
