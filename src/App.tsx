import { useCallback, useEffect, useRef, useState } from "react";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { SplitPane } from "./components/SplitPane";
import { TerminalPane, type Term } from "./components/TerminalPane";
import { PanelB } from "./components/PanelB";
import { type ActItem } from "./components/ActivityBar";
import { ViewTabs } from "./components/ViewTabs";
import { TitleBar } from "./components/TitleBar";
import { StatusBar } from "./components/StatusBar";
import { CommandPalette } from "./components/CommandPalette";
import { SettingsDrawer } from "./components/SettingsDrawer";
import { Welcome } from "./components/Welcome";
import { ApprovalPrompt } from "./components/ApprovalPrompt";
import { type ActivityEntry } from "./components/ActivityFeed";
import { ReplayView } from "./components/ReplayView";
import { applyTheme, loadTheme, type ThemeId } from "./lib/themes";
import {
  gitDiff,
  gitHeadInfo,
  onApproval,
  onApprovalExpired,
  onIntent,
  onPtyCwd,
  openWorkspace,
  resolveApproval,
  type ApprovalReq,
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

  const [terms, setTerms] = useState<Term[]>([{ id: "t1", title: "Terminal 1" }]);
  const [activeTerm, setActiveTerm] = useState("t1");
  const [approvals, setApprovals] = useState<ApprovalReq[]>([]);
  const [history, setHistory] = useState<ActivityEntry[]>([]);
  const [replay, setReplay] = useState<ActivityEntry | null>(null);
  const entryId = useRef(0);

  const pinnedRef = useRef(pinned);
  pinnedRef.current = pinned;
  const wsRef = useRef<string>("");
  const lastSpecRef = useRef<string | null>(null);
  lastSpecRef.current = lastSpec;
  const activeTermRef = useRef(activeTerm);
  activeTermRef.current = activeTerm;
  const termSeq = useRef(1);
  const termCwds = useRef<Record<string, string>>({});

  const repoint = useCallback((dir: string) => {
    openWorkspace(dir)
      .then((repo) => {
        wsRef.current = dir;
        setWsPath(dir);
        setIsRepo(repo);
        setSeq((s) => s + 1);
      })
      .catch(() => {});
  }, []);

  const addTerm = () => {
    const n = ++termSeq.current;
    const id = `t${n}`;
    setTerms((ts) => [...ts, { id, title: `Terminal ${n}` }]);
    setActiveTerm(id);
  };
  const activateTerm = (id: string) => {
    setActiveTerm(id);
    const dir = termCwds.current[id];
    if (dir && dir !== wsRef.current) repoint(dir);
  };
  const closeTerm = (id: string) => {
    setTerms((prev) => {
      if (prev.length <= 1) return prev;
      const idx = prev.findIndex((t) => t.id === id);
      const rest = prev.filter((t) => t.id !== id);
      if (id === activeTermRef.current) {
        const next = rest[Math.max(0, idx - 1)] ?? rest[0];
        setActiveTerm(next.id);
      }
      return rest;
    });
  };

  useEffect(() => applyTheme(theme), [theme]);

  const apply = useCallback((next: ViewIntent, src: Source) => {
    setReplay(null); // any navigation / new work exits replay
    setIntent(next);
    setSource(src);
    setSeq((s) => s + 1);
    if (next.kind === "spec" && next.path) setLastSpec(next.path);
  }, []);

  useEffect(() => {
    const p = onIntent((ev) => {
      // Log every reactive event (even when pinned) — this is the movie of the work.
      const id = ++entryId.current;
      setHistory((h) =>
        [{ id, intent: ev.intent, source: ev.source, at: Date.now(), burst: ev.burst }, ...h].slice(
          0,
          300,
        ),
      );
      // Snapshot the working-tree diff so this event is replayable later.
      if (ev.intent.kind === "diff" || ev.intent.kind === "tree") {
        Promise.all([
          gitDiff([]).catch(() => ""),
          gitHeadInfo().then((h) => h.branch).catch(() => ""),
        ]).then(([patch, head]) => {
          const p =
            patch.length > 200000 ? patch.slice(0, 200000) + "\n… (snapshot truncated)" : patch;
          setHistory((h) => h.map((e) => (e.id === id ? { ...e, patch: p, head } : e)));
        });
      }
      if (!pinnedRef.current) apply(ev.intent, ev.source);
    });
    return () => {
      p.then((off) => off());
    };
  }, [apply]);

  useEffect(() => {
    const p = onPtyCwd(({ id, dir }) => {
      if (!dir) return;
      termCwds.current[id] = dir;
      if (id !== activeTermRef.current || dir === wsRef.current) return;
      repoint(dir);
    });
    return () => {
      p.then((off) => off());
    };
  }, [repoint]);

  // Agent approval requests (round-trip over the override socket).
  useEffect(() => {
    const p1 = onApproval((req) => setApprovals((q) => [...q, req]));
    const p2 = onApprovalExpired((id) =>
      setApprovals((q) => q.filter((a) => a.id !== id)),
    );
    return () => {
      p1.then((off) => off());
      p2.then((off) => off());
    };
  }, []);

  const decideApproval = useCallback((approved: boolean) => {
    setApprovals((q) => {
      const [first, ...rest] = q;
      if (first) resolveApproval(first.id, approved).catch(() => {});
      return rest;
    });
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
      // Don't hijack keys while typing (commit box, search, terminal, etc).
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) {
        return;
      }
      if (mod && e.shiftKey) {
        const map: Record<string, ViewIntent> = {
          e: { kind: "spec", path: lastSpecRef.current ?? "" },
          g: { kind: "tree" },
          d: { kind: "diff", paths: [] },
          t: { kind: "log" },
          f: { kind: "search" },
          a: { kind: "activity" },
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
      const next = [target, ...recents.filter((r) => r !== target)].slice(0, 12);
      setRecents(next);
      localStorage.setItem("vellum.recents", JSON.stringify(next));
      localStorage.setItem("slate.last", target);
      apply({ kind: "tree" }, "manual");
    } catch (e) {
      console.error("open failed", e);
    }
  };

  // Reopen the last workspace on launch.
  useEffect(() => {
    const last = localStorage.getItem("slate.last");
    if (last) openWith(last);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const browse = async () => {
    const s = await openDialog({ directory: true, multiple: false, title: "Open folder" });
    if (typeof s === "string") openWith(s);
  };

  const closeWorkspace = () => setOpened(false);

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
    else if (id === "activity") apply({ kind: "activity" }, "manual");
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
            : intent.kind === "activity"
              ? "activity"
              : "changes";

  if (!opened) {
    return <Welcome onOpen={openWith} recents={recents} />;
  }

  return (
    <div className="shell">
      <TitleBar cwd={wsPath} onCommand={() => setPaletteOpen(true)} />
      <div className="shell-main">
        <SplitPane
          left={
            <TerminalPane
              terms={terms}
              activeId={activeTerm}
              themeId={theme}
              onActivate={activateTerm}
              onAdd={addTerm}
              onClose={closeTerm}
            />
          }
          right={
            <div className="panel-b">
              <ViewTabs active={active} onSelect={navigate} />
              <div className="panel-body">
                {replay ? (
                  <ReplayView entry={replay} onClose={() => setReplay(null)} />
                ) : (
                  <PanelB
                    intent={intent}
                    seq={seq}
                    onSelectFile={onSelectFile}
                    onGitChanged={() => setSeq((s) => s + 1)}
                    history={history}
                    onReplay={(entry) => {
                      if (entry.patch !== undefined) setReplay(entry);
                      else apply(entry.intent, "manual");
                    }}
                    onClearHistory={() => setHistory([])}
                  />
                )}
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

      {approvals[0] && (
        <ApprovalPrompt req={approvals[0]} onDecide={decideApproval} />
      )}

      {paletteOpen && (
        <CommandPalette
          onClose={() => setPaletteOpen(false)}
          onNavigate={navigate}
          onOpenSpec={(p) => apply({ kind: "spec", path: p }, "manual")}
          onTogglePin={() => setPinned((v) => !v)}
          onOpenSettings={() => setSettingsOpen(true)}
          onSetTheme={setTheme}
          onOpenFolder={browse}
          onCloseWorkspace={closeWorkspace}
        />
      )}
      {settingsOpen && (
        <SettingsDrawer theme={theme} onSetTheme={setTheme} onClose={() => setSettingsOpen(false)} />
      )}
    </div>
  );
}

export default App;
