import { useEffect, useRef, useState } from "react";
import { Icon } from "./ActivityBar";
import type { ActItem } from "./ActivityBar";

const ITEMS: { id: ActItem; label: string }[] = [
  { id: "specs", label: "Specs" },
  { id: "changes", label: "Changes" },
  { id: "diff", label: "Diff" },
  { id: "timeline", label: "Timeline" },
];

const LABEL: Record<ActItem, string> = {
  specs: "Specs",
  changes: "Changes",
  diff: "Diff",
  timeline: "Timeline",
};

// Cursor-style view-switcher menu at the top of the right pane: the current
// view name + chevron; click opens a labeled dropdown of all views.
export function ViewMenu({
  active,
  onSelect,
  onSearch,
}: {
  active: ActItem;
  onSelect: (id: ActItem) => void;
  onSearch: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", h);
    return () => window.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div className="view-menu" ref={ref}>
      <button className="vm-button" onClick={() => setOpen((v) => !v)}>
        <Icon name={active} />
        <span className="vm-current">{LABEL[active]}</span>
        <span className={`vm-chev ${open ? "open" : ""}`}>▾</span>
      </button>

      <button className="vm-search" title="Search (⌘K)" onClick={onSearch}>
        <Icon name="search" />
      </button>

      {open && (
        <div className="vm-dropdown">
          {ITEMS.map((it) => (
            <button
              key={it.id}
              className={`vm-item ${active === it.id ? "on" : ""}`}
              onClick={() => {
                onSelect(it.id);
                setOpen(false);
              }}
            >
              <Icon name={it.id} />
              <span className="vm-label">{it.label}</span>
            </button>
          ))}
          <div className="vm-divider" />
          <button
            className="vm-item"
            onClick={() => {
              onSearch();
              setOpen(false);
            }}
          >
            <Icon name="search" />
            <span className="vm-label">Search</span>
            <span className="vm-kbd">⌘K</span>
          </button>
        </div>
      )}
    </div>
  );
}
