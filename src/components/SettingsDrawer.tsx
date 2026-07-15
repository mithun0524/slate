import { THEMES, type ThemeId } from "../lib/themes";
import { OVERRIDE_PORT } from "../lib/ipc";

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
  return (
    <div className="drawer-overlay" onMouseDown={onClose}>
      <div className="drawer" onMouseDown={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <span>Settings</span>
          <button className="drawer-x" onClick={onClose}>
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
            An agent (or hook) can force Panel B to a view by sending one JSON
            line to the local socket:
          </p>
          <pre className="drawer-code">{`echo '{"kind":"tree"}' | nc 127.0.0.1 ${OVERRIDE_PORT}
echo '{"kind":"spec","path":"README.md"}' | nc 127.0.0.1 ${OVERRIDE_PORT}
echo '{"kind":"diff","paths":[]}' | nc 127.0.0.1 ${OVERRIDE_PORT}`}</pre>
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
