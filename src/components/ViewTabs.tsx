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

const MAX_VISIBLE = 5;

// Centered horizontal icon-tab strip. Up to MAX_VISIBLE icons; the rest fold
// into a chevron dropdown (labeled + shortcuts).
export function ViewTabs({
  active,
  onSelect,
}: {
  active: ActItem;
  onSelect: (id: ActItem) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const visible = ITEMS.slice(0, MAX_VISIBLE);
  const overflow = ITEMS.slice(MAX_VISIBLE);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", h);
    return () => window.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div className="view-tabs" ref={ref}>
      {visible.map((it) => (
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

      {overflow.length > 0 && (
        <div className="vt-more-wrap">
          <button
            className={`vt-btn vt-more ${overflow.some((o) => o.id === active) ? "on" : ""}`}
            onClick={() => setOpen((v) => !v)}
            title="More views"
          >
            <span className={`vt-chev ${open ? "open" : ""}`}>⌄</span>
          </button>
          {open && (
            <div className="vt-dropdown">
              {overflow.map((it) => (
                <button
                  key={it.id}
                  className={`vt-item ${active === it.id ? "on" : ""}`}
                  onClick={() => {
                    onSelect(it.id);
                    setOpen(false);
                  }}
                >
                  <Icon name={it.id} />
                  <span className="vt-item-label">{it.label}</span>
                  <span className="vt-kbd">{it.kbd}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
