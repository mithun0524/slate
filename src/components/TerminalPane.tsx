import { Terminal } from "./Terminal";
import type { ThemeId } from "../lib/themes";
import { SquareTerminal, Plus, X } from "lucide-react";

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
      <div className="term-body">
        {terms.map((t) => (
          <Terminal key={t.id} id={t.id} themeId={themeId} active={t.id === activeId} />
        ))}
      </div>
    </div>
  );
}
