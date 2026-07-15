import { useCallback, useEffect, useRef, useState } from "react";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { SplitPane } from "./components/SplitPane";
import { Terminal } from "./components/Terminal";
import { PanelB } from "./components/PanelB";
import { ActivityBar, type ActItem } from "./components/ActivityBar";
import { ViewMenu } from "./components/ViewMenu";
import { TitleBar } from "./components/TitleBar";
import { StatusBar } from "./components/StatusBar";
import { CommandPalette } from "./components/CommandPalette";
import { SettingsDrawer } from "./components/SettingsDrawer";
import { applyTheme, loadTheme, type ThemeId } from "./lib/themes";
import { FileIcon } from "./components/FileIcon";
import {
  onIntent,
  onPtyCwd,
  openWorkspace,
  searchDirs,
  type IntentSource,
  type ViewIntent,
} from "./lib/ipc";
import "./styles.css";

type Source = IntentSource | "manual";

function App() {
  const [path, setPath] = useState<string>("");
  const [opened, setOpened] = useState(false);
  const [isRepo, setIsRepo] = useState(true);
  const [openErr, setOpenErr] = useState<string | null>(null);
  const [wsPath, setWsPath] = useState("");

  const [intent, setIntent] = useState<ViewIntent>({ kind: "tree" });
  const [seq, setSeq] = useState(0);
  const [source, setSource] = useState<Source>("classifier");
  const [pinned, setPinned] = useState(false);
  const [lastSpec, setLastSpec] = useState<string | null>(null);

  const [theme, setTheme] = useState<ThemeId>(loadTheme);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [recents, setRecents] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("vellum.recents") || "[]");
    } catch {
      return [];
    }
  });
  const [results, setResults] = useState<string[]>([]);
  const [sel, setSel] = useState(0);
  const searchTimer = useRef<number | undefined>(undefined);

  const pinnedRef = useRef(pinned);
  pinnedRef.current = pinned;
  const wsRef = useRef<string>("");

  useEffect(() => applyTheme(theme), [theme]);

  const apply = useCallback((next: ViewIntent, src: Source) => {
    setIntent(next);
    setSource(src);
    setSeq((s) => s + 1);
    if (next.kind === "spec" && next.path) setLastSpec(next.path);
  }, []);

  useEffect(() => {
    const p = onIntent((ev) => {
      if (pinnedRef.current) return;
      apply(ev.intent, ev.source);
    });
    return () => {
      p.then((off) => off());
    };
  }, [apply]);

  useEffect(() => {
    const p = onPtyCwd((dir) => {
      if (!dir || dir === wsRef.current) return;
      openWorkspace(dir)
        .then((repo) => {
          wsRef.current = dir;
          setWsPath(dir);
          setIsRepo(repo);
          setSeq((s) => s + 1);
        })
        .catch(() => {});
    });
    return () => {
      p.then((off) => off());
    };
  }, []);

  // Global shortcuts: ⌘K / ⌘⇧P palette, Esc closes overlays.
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && (e.key === "k" || (e.shiftKey && e.key.toLowerCase() === "p"))) {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      } else if (e.key === "Escape") {
        setPaletteOpen(false);
        setSettingsOpen(false);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const openWith = async (p: string) => {
    const target = p.trim();
    if (!target) return;
    try {
      const repo = await openWorkspace(target);
      wsRef.current = target;
      setWsPath(target);
      setIsRepo(repo);
      setOpened(true);
      setOpenErr(null);
      const next = [target, ...recents.filter((r) => r !== target)].slice(0, 6);
      setRecents(next);
      localStorage.setItem("vellum.recents", JSON.stringify(next));
      apply({ kind: "tree" }, "manual");
    } catch (e) {
      setOpenErr(String(e));
    }
  };

  const browse = async () => {
    const sel = await openDialog({ directory: true, multiple: false, title: "Open workspace folder" });
    if (typeof sel === "string") {
      setPath(sel);
      openWith(sel);
    }
  };

  const onQuery = (v: string) => {
    setPath(v);
    setSel(0);
    window.clearTimeout(searchTimer.current);
    if (v.trim().length >= 2) {
      searchTimer.current = window.setTimeout(() => {
        searchDirs(v)
          .then(setResults)
          .catch(() => setResults([]));
      }, 160);
    } else {
      setResults([]);
    }
  };

  const gateKey = (e: React.KeyboardEvent, list: string[]) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel((s) => Math.min(s + 1, list.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (list[sel]) openWith(list[sel]);
      else if (path.trim()) openWith(path);
    }
  };

  const onSelectFile = (p: string) => {
    if (/\.(md|markdown)$/i.test(p)) apply({ kind: "spec", path: p }, "manual");
    else apply({ kind: "diff", paths: [p] }, "manual");
  };

  const navigate = (id: ActItem) => {
    if (id === "specs") apply({ kind: "spec", path: lastSpec ?? "" }, "manual");
    else if (id === "changes") apply({ kind: "tree" }, "manual");
    else if (id === "diff") apply({ kind: "diff", paths: [] }, "manual");
    else if (id === "timeline") apply({ kind: "log" }, "manual");
  };

  const active: ActItem =
    intent.kind === "spec"
      ? "specs"
      : intent.kind === "diff"
        ? "diff"
        : intent.kind === "log"
          ? "timeline"
          : "changes";

  if (!opened) {
    const showResults = path.trim().length >= 2;
    const list = showResults ? results : recents;
    return (
      <div className="gate">
        <div className="gate-card">
          <h1 className="brand">Vellum</h1>
          <p className="tagline">terminal + reactive spec / git surface</p>
          <button className="btn primary big" onClick={browse}>
            Open folder…
          </button>
          <div className="gate-or">or search your machine</div>
          <div className="spot">
            <div className="spot-search">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                <circle cx="7" cy="7" r="4.5" />
                <path d="M11 11l3.5 3.5" strokeLinecap="round" />
              </svg>
              <input
                className="spot-input"
                placeholder="Search folders by name…  or paste a /path"
                value={path}
                onChange={(e) => onQuery(e.currentTarget.value)}
                onKeyDown={(e) => gateKey(e, list)}
                autoFocus
              />
            </div>
            {list.length > 0 ? (
              <div className="spot-list">
                {!showResults && <div className="spot-head">Recent</div>}
                {list.map((p, i) => (
                  <button
                    key={p}
                    className={`spot-row ${i === sel ? "sel" : ""}`}
                    onMouseEnter={() => setSel(i)}
                    onClick={() => openWith(p)}
                    title={p}
                  >
                    <FileIcon name={p} dir open={false} />
                    <span className="spot-name">{p.split("/").pop() || p}</span>
                    <span className="spot-path">{p}</span>
                  </button>
                ))}
              </div>
            ) : showResults ? (
              <div className="spot-empty">No matching folders</div>
            ) : null}
          </div>
          {openErr && <div className="gate-err">{openErr}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="shell">
      <TitleBar cwd={wsPath} onCommand={() => setPaletteOpen(true)} />
      <ActivityBar
        active={active}
        onSelect={navigate}
        onSearch={() => setPaletteOpen(true)}
        onSettings={() => setSettingsOpen(true)}
      />
      <div className="shell-main">
        <SplitPane
          left={<Terminal themeId={theme} />}
          right={
            <div className="panel-b">
              <ViewMenu active={active} onSelect={navigate} onSearch={() => setPaletteOpen(true)} />
              <div className="panel-body">
                <PanelB intent={intent} seq={seq} onSelectFile={onSelectFile} />
              </div>
            </div>
          }
        />
      </div>
      <StatusBar
        refreshKey={seq}
        isRepo={isRepo}
        source={source}
        pinned={pinned}
        onPin={() => setPinned((v) => !v)}
        cwd={wsPath}
        themeLabel={theme}
        onTheme={() => setSettingsOpen(true)}
      />

      {paletteOpen && (
        <CommandPalette
          onClose={() => setPaletteOpen(false)}
          onNavigate={navigate}
          onOpenSpec={(p) => apply({ kind: "spec", path: p }, "manual")}
          onTogglePin={() => setPinned((v) => !v)}
          onOpenSettings={() => setSettingsOpen(true)}
          onSetTheme={setTheme}
        />
      )}
      {settingsOpen && (
        <SettingsDrawer theme={theme} onSetTheme={setTheme} onClose={() => setSettingsOpen(false)} />
      )}
    </div>
  );
}

export default App;
