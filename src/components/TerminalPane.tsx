import { Terminal } from "./Terminal";
import type { ThemeId } from "../lib/themes";

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
            <svg className="term-tab-ic" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 5l3 3-3 3M8.5 11h3.5" />
            </svg>
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
                ✕
              </button>
            )}
          </div>
        ))}
        <button className="term-add" title="New terminal" onClick={onAdd}>
          +
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
