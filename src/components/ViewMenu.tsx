import { useEffect, useRef, useState } from "react";
import { Icon } from "./ActivityBar";
import type { ActItem } from "./ActivityBar";

const ITEMS: { id: ActItem; label: string; kbd: string }[] = [
  { id: "specs", label: "Specs", kbd: "⇧⌘E" },
  { id: "changes", label: "Changes", kbd: "⌃⇧G" },
  { id: "diff", label: "Diff", kbd: "⇧⌘D" },
  { id: "timeline", label: "Timeline", kbd: "⇧⌘T" },
  { id: "search", label: "Search", kbd: "⇧⌘F" },
];

const LABEL: Record<ActItem, string> = {
  specs: "Specs",
  changes: "Changes",
  diff: "Diff",
  timeline: "Timeline",
  search: "Search",
};

// Cursor/VS Code-style view-switcher: current view name + chevron; click opens
// a labeled dropdown of all views with shortcuts.
export function ViewMenu({
  active,
  onSelect,
}: {
  active: ActItem;
  onSelect: (id: ActItem) => void;
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

      <button className="vm-search" title="Search in files (⇧⌘F)" onClick={() => onSelect("search")}>
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
              <span className="vm-kbd">{it.kbd}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
