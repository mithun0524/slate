import { useCallback, useEffect, useRef, useState } from "react";
import { SplitPane } from "./components/SplitPane";
import { Terminal } from "./components/Terminal";
import { PanelB } from "./components/PanelB";
import { type ActItem } from "./components/ActivityBar";
import { ViewMenu } from "./components/ViewMenu";
import { TitleBar } from "./components/TitleBar";
import { StatusBar } from "./components/StatusBar";
import { CommandPalette } from "./components/CommandPalette";
import { SettingsDrawer } from "./components/SettingsDrawer";
import { Welcome } from "./components/Welcome";
import { applyTheme, loadTheme, type ThemeId } from "./lib/themes";
import {
  onIntent,
  onPtyCwd,
  openWorkspace,
  type IntentSource,
  type ViewIntent,
} from "./lib/ipc";
import "./styles.css";

type Source = IntentSource | "manual";

function App() {
  const [opened, setOpened] = useState(false);
  const [isRepo, setIsRepo] = useState(true);
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

  const pinnedRef = useRef(pinned);
  pinnedRef.current = pinned;
  const wsRef = useRef<string>("");
  const lastSpecRef = useRef<string | null>(null);
  lastSpecRef.current = lastSpec;

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
        return;
      }
      if (mod && e.shiftKey) {
        const map: Record<string, ViewIntent> = {
          e: { kind: "spec", path: lastSpecRef.current ?? "" },
          g: { kind: "tree" },
          d: { kind: "diff", paths: [] },
          t: { kind: "log" },
          f: { kind: "search" },
        };
        const next = map[e.key.toLowerCase()];
        if (next) {
          e.preventDefault();
          apply(next, "manual");
          return;
        }
      }
      if (e.key === "Escape") {
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
      const next = [target, ...recents.filter((r) => r !== target)].slice(0, 6);
      setRecents(next);
      localStorage.setItem("vellum.recents", JSON.stringify(next));
      apply({ kind: "tree" }, "manual");
    } catch (e) {
      console.error("open failed", e);
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
    else if (id === "search") apply({ kind: "search" }, "manual");
  };

  const active: ActItem =
    intent.kind === "spec"
      ? "specs"
      : intent.kind === "diff"
        ? "diff"
        : intent.kind === "log"
          ? "timeline"
          : intent.kind === "search"
            ? "search"
            : "changes";

  if (!opened) {
    return <Welcome onOpen={openWith} recents={recents} />;
  }

  return (
    <div className="shell">
      <TitleBar cwd={wsPath} onCommand={() => setPaletteOpen(true)} />
      <div className="shell-main">
        <SplitPane
          left={<Terminal themeId={theme} />}
          right={
            <div className="panel-b">
              <ViewMenu active={active} onSelect={navigate} />
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
        onSettings={() => setSettingsOpen(true)}
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
