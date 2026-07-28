import { useEffect, useRef, useState } from "react";
import { Terminal, type TermHandle } from "./Terminal";
import type { ThemeId } from "../lib/themes";
import { SquareTerminal, Plus, X, ChevronUp, ChevronDown, Search } from "lucide-react";

export interface Term {
  id: string;
  title: string;
}

// Left pane: a tab strip over one-or-more terminal sessions. All terminals stay
// mounted (sessions persist); only the active one is visible.
export function TerminalPane({
  terms,
  activeId,
  themeId,
  onActivate,
  onAdd,
  onClose,
}: {
  terms: Term[];
  activeId: string;
  themeId: ThemeId;
  onActivate: (id: string) => void;
  onAdd: () => void;
  onClose: (id: string) => void;
}) {
  const handles = useRef<Record<string, TermHandle | null>>({});
  const [finding, setFinding] = useState(false);
  const [q, setQ] = useState("");
  const [miss, setMiss] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const active = () => handles.current[activeId];

  const jump = (back: boolean) => {
    const hit = active()?.find(q, back) ?? false;
    setMiss(!!q && !hit);
  };

  const closeFind = () => {
    setFinding(false);
    setMiss(false);
    active()?.clearFind();
    active()?.focus();
  };

  // ⌘F opens the find bar while the terminal pane has focus. The terminal
  // swallows keystrokes itself, so this listens at the document level.
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "f") {
        const inPane = (e.target as HTMLElement | null)?.closest?.(".term-pane");
        if (!inPane) return;
        e.preventDefault();
        setFinding(true);
        window.setTimeout(() => inputRef.current?.select(), 0);
      }
    };
    document.addEventListener("keydown", h, true);
    return () => document.removeEventListener("keydown", h, true);
  }, []);

  return (
    <div className="term-pane">
      <div className="term-tabs">
        {terms.map((t) => (
          <div
            key={t.id}
            className={`term-tab ${t.id === activeId ? "on" : ""}`}
            onClick={() => onActivate(t.id)}
          >
            <SquareTerminal className="term-tab-ic" size={14} />
            <span className="term-tab-title">{t.title}</span>
            {terms.length > 1 && (
              <button
                className="term-close"
                title="Close terminal"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose(t.id);
                }}
              >
                <X size={13} />
              </button>
            )}
          </div>
        ))}
        <button className="term-add" title="New terminal" onClick={onAdd}>
          <Plus size={15} />
        </button>
      </div>

      {finding && (
        <div className="term-find">
          <Search size={13} className="term-find-ic" />
          <input
            ref={inputRef}
            className={`term-find-input ${miss ? "miss" : ""}`}
            placeholder="Find in terminal"
            autoFocus
            value={q}
            onChange={(e) => {
              setQ(e.currentTarget.value);
              setMiss(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") jump(e.shiftKey);
              else if (e.key === "Escape") closeFind();
            }}
          />
          <button className="term-find-btn" title="Previous (⇧↵)" onClick={() => jump(true)}>
            <ChevronUp size={14} />
          </button>
          <button className="term-find-btn" title="Next (↵)" onClick={() => jump(false)}>
            <ChevronDown size={14} />
          </button>
          <button className="term-find-btn" title="Close (Esc)" onClick={closeFind}>
            <X size={14} />
          </button>
        </div>
      )}

      <div className="term-body">
        {terms.map((t) => (
          <Terminal
            key={t.id}
            id={t.id}
            themeId={themeId}
            active={t.id === activeId}
            handleRef={(h) => {
              handles.current[t.id] = h;
            }}
          />
        ))}
      </div>
    </div>
  );
}
