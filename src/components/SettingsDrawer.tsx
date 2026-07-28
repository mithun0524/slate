import { useEffect } from "react";
import { THEMES, type ThemeId } from "../lib/themes";
import { OVERRIDE_PORT } from "../lib/ipc";
import { useExit } from "../lib/useExit";

// Settings panel: theme picker + reference info. (More knobs land in Phase 2.)
export function SettingsDrawer({
  theme,
  onSetTheme,
  onClose,
}: {
  theme: ThemeId;
  onSetTheme: (id: ThemeId) => void;
  onClose: () => void;
}) {
  const { closing, close } = useExit(onClose, 200); // matches the slide-out
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [close]);

  return (
    <div className={`drawer-overlay ${closing ? "closing" : ""}`} onMouseDown={close}>
      <div
        className={`drawer ${closing ? "closing" : ""}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="drawer-head">
          <span>Settings</span>
          <button className="drawer-x" onClick={close}>
            ✕
          </button>
        </div>

        <div className="drawer-section">
          <div className="drawer-title">Theme</div>
          <div className="theme-grid">
            {THEMES.map((t) => (
              <button
                key={t.id}
                className={`theme-card ${theme === t.id ? "on" : ""}`}
                onClick={() => onSetTheme(t.id)}
              >
                <span
                  className="theme-swatch"
                  style={{
                    background: t.vars["--bg-1"],
                    borderColor: t.vars["--border"],
                  }}
                >
                  <span style={{ background: t.vars["--accent"] }} />
                  <span style={{ background: t.vars["--fg-mut"] }} />
                </span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="drawer-section">
          <div className="drawer-title">Agent override</div>
          <p className="drawer-note">
            An agent (or hook) drives Slate by sending one JSON line to the
            local socket on port {OVERRIDE_PORT}:
          </p>
          <pre className="drawer-code">{`# force a view
echo '{"kind":"tree"}'                     | nc 127.0.0.1 ${OVERRIDE_PORT}
echo '{"kind":"spec","path":"README.md"}'  | nc 127.0.0.1 ${OVERRIDE_PORT}

# narrate (toast + activity log)
echo '{"note":"refactored the parser"}'    | nc 127.0.0.1 ${OVERRIDE_PORT}

# ask for approval (blocks, prints {"approved":bool})
echo '{"approval":{"id":"a1","title":"Ship?","detail":"3 files"}}' | nc 127.0.0.1 ${OVERRIDE_PORT}`}</pre>
        </div>

        <div className="drawer-section">
          <div className="drawer-title">Reactive engine</div>
          <p className="drawer-note">
            Panel B auto-switches on a ~400 ms debounced filesystem burst
            (spec → Spec, edits → Diff, new/deleted files → Changes). Pin any
            view to freeze it. Panel B follows the terminal's directory.
          </p>
        </div>
      </div>
    </div>
  );
}
