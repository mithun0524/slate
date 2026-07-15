import { useEffect, useMemo, useRef, useState } from "react";
import { listSpecs } from "../lib/ipc";
import { THEMES, type ThemeId } from "../lib/themes";
import type { ActItem } from "./ActivityBar";

interface Cmd {
  id: string;
  label: string;
  hint?: string;
  run: () => void;
}

function fuzzy(q: string, s: string): number {
  if (!q) return 1;
  const t = s.toLowerCase();
  q = q.toLowerCase();
  if (t.includes(q)) return 100 - (t.indexOf(q) || 0);
  let i = 0;
  let score = 0;
  for (const ch of t) {
    if (i < q.length && ch === q[i]) {
      i++;
      score++;
    }
  }
  return i === q.length ? score : -1;
}

export function CommandPalette({
  onClose,
  onNavigate,
  onOpenSpec,
  onTogglePin,
  onOpenSettings,
  onSetTheme,
  onOpenFolder,
  onCloseWorkspace,
}: {
  onClose: () => void;
  onNavigate: (id: ActItem) => void;
  onOpenSpec: (path: string) => void;
  onTogglePin: () => void;
  onOpenSettings: () => void;
  onSetTheme: (id: ThemeId) => void;
  onOpenFolder: () => void;
  onCloseWorkspace: () => void;
}) {
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const [specs, setSpecs] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    listSpecs()
      .then(setSpecs)
      .catch(() => {});
  }, []);

  const commands = useMemo<Cmd[]>(() => {
    const wrap = (fn: () => void) => () => {
      fn();
      onClose();
    };
    const base: Cmd[] = [
      { id: "go-specs", label: "Go to Specs", hint: "view", run: wrap(() => onNavigate("specs")) },
      { id: "go-changes", label: "Go to Changes", hint: "view", run: wrap(() => onNavigate("changes")) },
      { id: "go-diff", label: "Go to Diff", hint: "view", run: wrap(() => onNavigate("diff")) },
      { id: "go-timeline", label: "Go to Timeline", hint: "view", run: wrap(() => onNavigate("timeline")) },
      { id: "go-search", label: "Go to Search", hint: "view", run: wrap(() => onNavigate("search")) },
      { id: "open-folder", label: "Open Folder…", hint: "workspace", run: wrap(onOpenFolder) },
      { id: "close-ws", label: "Close Workspace", hint: "workspace", run: wrap(onCloseWorkspace) },
      { id: "pin", label: "Toggle Pin", hint: "action", run: wrap(onTogglePin) },
      { id: "settings", label: "Open Settings", hint: "action", run: wrap(onOpenSettings) },
      ...THEMES.map((t) => ({
        id: `theme-${t.id}`,
        label: `Theme: ${t.label}`,
        hint: "theme",
        run: wrap(() => onSetTheme(t.id)),
      })),
      ...specs.map((p) => ({
        id: `spec-${p}`,
        label: p,
        hint: "spec",
        run: wrap(() => {
          onNavigate("specs");
          onOpenSpec(p);
        }),
      })),
    ];
    return base;
  }, [specs, onClose, onNavigate, onOpenSpec, onTogglePin, onOpenSettings, onSetTheme, onOpenFolder, onCloseWorkspace]);

  const filtered = useMemo(() => {
    return commands
      .map((c) => ({ c, s: fuzzy(q, c.label) }))
      .filter((x) => x.s >= 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 40)
      .map((x) => x.c);
  }, [commands, q]);

  useEffect(() => setSel(0), [q]);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel((s) => Math.min(s + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      filtered[sel]?.run();
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <div className="palette-overlay" onMouseDown={onClose}>
      <div className="palette" onMouseDown={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="palette-input"
          placeholder="Type a command or spec name…"
          value={q}
          onChange={(e) => setQ(e.currentTarget.value)}
          onKeyDown={onKey}
        />
        <div className="palette-list">
          {filtered.length === 0 ? (
            <div className="palette-empty">No matches</div>
          ) : (
            filtered.map((c, i) => (
              <div
                key={c.id}
                className={`palette-row ${i === sel ? "sel" : ""}`}
                onMouseEnter={() => setSel(i)}
                onClick={() => c.run()}
              >
                <span className="palette-label">{c.label}</span>
                {c.hint && <span className="palette-hint">{c.hint}</span>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
