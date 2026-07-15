import { useCallback, useEffect, useRef, useState } from "react";
import { SplitPane } from "./components/SplitPane";
import { Terminal } from "./components/Terminal";
import { PanelB } from "./components/PanelB";
import {
  onIntent,
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

  // `pinned` is read inside the intent listener; keep a ref so we don't need to
  // re-subscribe on every toggle.
  const pinnedRef = useRef(pinned);
  pinnedRef.current = pinned;

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

  const doOpen = async () => {
    try {
      const repo = await openWorkspace(path.trim());
      setIsRepo(repo);
      setOpened(true);
      setOpenErr(null);
      apply({ kind: "tree" }, "manual");
    } catch (e) {
      setOpenErr(String(e));
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
          <label className="gate-label">Workspace folder</label>
          <div className="gate-row">
            <input
              className="gate-input"
              placeholder="/Users/you/project"
              value={path}
              onChange={(e) => setPath(e.currentTarget.value)}
              onKeyDown={(e) => e.key === "Enter" && doOpen()}
              autoFocus
            />
            <button className="btn primary" onClick={doOpen} disabled={!path.trim()}>
              Open
            </button>
          </div>
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
              <div className="tabs">
                <button
                  className={`tab ${intent.kind === "spec" ? "on" : ""}`}
                  disabled={!lastSpec}
                  onClick={() =>
                    lastSpec && apply({ kind: "spec", path: lastSpec }, "manual")
                  }
                >
                  Spec
                </button>
                <button
                  className={`tab ${intent.kind === "tree" ? "on" : ""}`}
                  onClick={() => apply({ kind: "tree" }, "manual")}
                >
                  Tree
                </button>
                <button
                  className={`tab ${intent.kind === "diff" ? "on" : ""}`}
                  onClick={() => apply({ kind: "diff", paths: [] }, "manual")}
                >
                  Diff
                </button>
              </div>
              <div className="toolbar-right">
                {!isRepo && <span className="badge warn">not a git repo</span>}
                <span className={`badge src-${source}`}>{source}</span>
                <button
                  className={`pin ${pinned ? "on" : ""}`}
                  title={pinned ? "Unpin (resume auto-switch)" : "Pin this view"}
                  onClick={() => setPinned((v) => !v)}
                >
                  {pinned ? "📌 pinned" : "pin"}
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
