import type { ReactNode } from "react";

export type ActItem = "specs" | "changes" | "diff" | "timeline";

const ICONS: Record<string, ReactNode> = {
  specs: (
    <path d="M4 2h8l4 4v12H4V2zm8 1v4h4M7 11h6M7 14h6" />
  ),
  changes: (
    <>
      <circle cx="6" cy="5" r="2" />
      <circle cx="6" cy="15" r="2" />
      <circle cx="14" cy="10" r="2" />
      <path d="M6 7v6M8 15h2a2 2 0 002-2v-1" />
    </>
  ),
  diff: <path d="M5 4v8m-3-4h6m1 6h6m-3-3l3 3-3 3" />,
  timeline: (
    <>
      <circle cx="10" cy="10" r="7" />
      <path d="M10 6v4l3 2" />
    </>
  ),
  search: (
    <>
      <circle cx="9" cy="9" r="5" />
      <path d="M13 13l4 4" />
    </>
  ),
  settings: (
    <>
      <circle cx="10" cy="10" r="2.5" />
      <path d="M10 2v2m0 12v2m8-8h-2M4 10H2m13.6-5.6l-1.4 1.4M5.8 14.2l-1.4 1.4m0-11.2l1.4 1.4m8.4 8.4l1.4 1.4" />
    </>
  ),
};

function Icon({ name }: { name: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {ICONS[name]}
    </svg>
  );
}

const ITEMS: { id: ActItem; label: string }[] = [
  { id: "specs", label: "Specs" },
  { id: "changes", label: "Changes" },
  { id: "diff", label: "Diff" },
  { id: "timeline", label: "Timeline" },
];

// Cursor/VS Code-style left icon rail. Selects the primary Panel B view.
export function ActivityBar({
  active,
  onSelect,
  onSearch,
  onSettings,
}: {
  active: ActItem;
  onSelect: (id: ActItem) => void;
  onSearch: () => void;
  onSettings: () => void;
}) {
  return (
    <div className="activity-bar">
      <div className="act-group">
        {ITEMS.map((it) => (
          <button
            key={it.id}
            className={`act-btn ${active === it.id ? "on" : ""}`}
            title={it.label}
            onClick={() => onSelect(it.id)}
          >
            <Icon name={it.id} />
          </button>
        ))}
        <button className="act-btn" title="Search (⌘K)" onClick={onSearch}>
          <Icon name="search" />
        </button>
      </div>
      <div className="act-group">
        <button className="act-btn" title="Settings" onClick={onSettings}>
          <Icon name="settings" />
        </button>
      </div>
    </div>
  );
}
