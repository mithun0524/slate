import { useCallback, useEffect, useRef, useState } from "react";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { SplitPane } from "./components/SplitPane";
import { Terminal } from "./components/Terminal";
import { PanelB } from "./components/PanelB";
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
  const [path, setPath] = useState<string>("");
  const [opened, setOpened] = useState(false);
  const [isRepo, setIsRepo] = useState(true);
  const [openErr, setOpenErr] = useState<string | null>(null);

  const [intent, setIntent] = useState<ViewIntent>({ kind: "tree" });
  const [seq, setSeq] = useState(0);
  const [source, setSource] = useState<Source>("classifier");
  const [pinned, setPinned] = useState(false);
  const [lastSpec, setLastSpec] = useState<string | null>(null);
  const [recents, setRecents] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("vellum.recents") || "[]");
    } catch {
      return [];
    }
  });

  // `pinned` is read inside the intent listener; keep a ref so we don't need to
  // re-subscribe on every toggle.
  const pinnedRef = useRef(pinned);
  pinnedRef.current = pinned;

  // Current workspace root; used to dedupe cwd events (the shell re-emits its
  // cwd on every prompt, not only on `cd`).
  const wsRef = useRef<string>("");

  const apply = useCallback((next: ViewIntent, src: Source) => {
    setIntent(next);
    setSource(src);
    setSeq((s) => s + 1);
    if (next.kind === "spec") setLastSpec(next.path);
  }, []);

  useEffect(() => {
    const p = onIntent((ev) => {
      if (pinnedRef.current) return; // locked: ignore auto-switching
      apply(ev.intent, ev.source);
    });
    return () => {
      p.then((off) => off());
    };
  }, [apply]);

  // Follow the terminal: when the shell reports a new cwd (OSC 7), re-point the
  // workspace so Panel B (tree / diff / specs / log) tracks the terminal dir.
  useEffect(() => {
    const p = onPtyCwd((dir) => {
      if (!dir || dir === wsRef.current) return;
      openWorkspace(dir)
        .then((repo) => {
          wsRef.current = dir;
          setIsRepo(repo);
          setSeq((s) => s + 1); // refresh whatever view is showing
        })
        .catch(() => {
          /* dir may be unreadable; ignore */
        });
    });
    return () => {
      p.then((off) => off());
    };
  }, []);

  const openWith = async (p: string) => {
    const target = p.trim();
    if (!target) return;
    try {
      const repo = await openWorkspace(target);
      wsRef.current = target;
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
    const sel = await openDialog({
      directory: true,
      multiple: false,
      title: "Open workspace folder",
    });
    if (typeof sel === "string") {
      setPath(sel);
      openWith(sel);
    }
  };

  const onSelectFile = (p: string) => {
    if (/\.(md|markdown)$/i.test(p)) apply({ kind: "spec", path: p }, "manual");
    else apply({ kind: "diff", paths: [p] }, "manual");
  };

  if (!opened) {
    return (
      <div className="gate">
        <div className="gate-card">
          <h1 className="brand">Vellum</h1>
          <p className="tagline">terminal + reactive spec / git surface</p>

          <button className="btn primary big" onClick={browse}>
            Open folder…
          </button>

          <div className="gate-or">or paste a path</div>
          <div className="gate-row">
            <input
              className="gate-input"
              placeholder="/Users/you/project"
              value={path}
              onChange={(e) => setPath(e.currentTarget.value)}
              onKeyDown={(e) => e.key === "Enter" && openWith(path)}
              autoFocus
            />
            <button
              className="btn"
              onClick={() => openWith(path)}
              disabled={!path.trim()}
            >
              Open
            </button>
          </div>

          {recents.length > 0 && (
            <div className="recents">
              <div className="recents-title">Recent</div>
              {recents.map((r) => (
                <button
                  key={r}
                  className="recent-row"
                  onClick={() => openWith(r)}
                  title={r}
                >
                  <span className="recent-name">{r.split("/").pop() || r}</span>
                  <span className="recent-path">{r}</span>
                </button>
              ))}
            </div>
          )}

          {openErr && <div className="gate-err">{openErr}</div>}
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <SplitPane
        left={<Terminal />}
        right={
          <div className="panel-b">
            <div className="panel-toolbar">
              <div className="segmented" role="tablist">
                <button
                  className={`seg ${intent.kind === "spec" ? "on" : ""}`}
                  onClick={() =>
                    apply({ kind: "spec", path: lastSpec ?? "" }, "manual")
                  }
                >
                  Spec
                </button>
                <button
                  className={`seg ${intent.kind === "tree" ? "on" : ""}`}
                  onClick={() => apply({ kind: "tree" }, "manual")}
                >
                  Tree
                </button>
                <button
                  className={`seg ${intent.kind === "diff" ? "on" : ""}`}
                  onClick={() => apply({ kind: "diff", paths: [] }, "manual")}
                >
                  Diff
                </button>
                <button
                  className={`seg ${intent.kind === "log" ? "on" : ""}`}
                  onClick={() => apply({ kind: "log" }, "manual")}
                >
                  Log
                </button>
              </div>
              <div className="toolbar-right">
                {!isRepo && <span className="badge warn">no git</span>}
                <span className={`src-dot src-${source}`} title={`source: ${source}`}>
                  <span className="dot" />
                  {source}
                </span>
                <button
                  className={`pin ${pinned ? "on" : ""}`}
                  title={pinned ? "Unpin — resume auto-switching" : "Pin this view"}
                  onClick={() => setPinned((v) => !v)}
                >
                  {pinned ? "◆ pinned" : "◇ pin"}
                </button>
              </div>
            </div>
            <div className="panel-body">
              <PanelB intent={intent} seq={seq} onSelectFile={onSelectFile} />
            </div>
          </div>
        }
      />
    </div>
  );
}

export default App;
