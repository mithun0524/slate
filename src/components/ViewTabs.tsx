import { Icon } from "./ActivityBar";
import type { ActItem } from "./ActivityBar";

const ITEMS: { id: ActItem; label: string; kbd: string }[] = [
  { id: "specs", label: "Specs", kbd: "⇧⌘E" },
  { id: "changes", label: "Changes", kbd: "⌃⇧G" },
  { id: "diff", label: "Diff", kbd: "⇧⌘D" },
  { id: "timeline", label: "Timeline", kbd: "⇧⌘T" },
  { id: "search", label: "Search", kbd: "⇧⌘F" },
];

// Horizontal icon-tab strip (VS Code top-activity-bar style). Active tab boxed;
// label + shortcut shown on hover.
export function ViewTabs({
  active,
  onSelect,
}: {
  active: ActItem;
  onSelect: (id: ActItem) => void;
}) {
  return (
    <div className="view-tabs">
      {ITEMS.map((it) => (
        <button
          key={it.id}
          className={`vt-btn ${active === it.id ? "on" : ""}`}
          onClick={() => onSelect(it.id)}
        >
          <Icon name={it.id} />
          <span className="vt-tip">
            {it.label}
            <span className="vt-kbd">{it.kbd}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
