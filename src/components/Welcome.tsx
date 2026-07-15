import { useRef, useState } from "react";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { cloneRepo, createProject, searchDirs } from "../lib/ipc";
import { FileIcon } from "./FileIcon";

type Mode = "home" | "clone" | "new" | "search";

const ActionIcon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);

const ICON = {
  folder: "M2.5 5.5A1.5 1.5 0 014 4h3l1.8 1.8H16A1.5 1.5 0 0117.5 7.3v7.2A1.5 1.5 0 0116 16H4a1.5 1.5 0 01-1.5-1.5z",
  git: "M10 3v6m0 5v3M5 7a2.5 2.5 0 105 0 2.5 2.5 0 00-5 0zm5 5a2.5 2.5 0 105 0 2.5 2.5 0 00-5 0z",
  plus: "M10 4v12M4 10h12",
  search: "M8.5 3a5.5 5.5 0 104 9.3l3.5 3.5M8.5 3a5.5 5.5 0 010 11",
};

// Shorten a home-rooted path to ~ for display.
function shortHome(p: string): string {
  return p.replace(/^\/Users\/[^/]+/, "~").replace(/^\/home\/[^/]+/, "~");
}

// Cursor-style start screen: 2x2 action grid + recents (+ clone / new / search).
export function Welcome({
  onOpen,
  recents,
}: {
  onOpen: (path: string) => void;
  recents: string[];
}) {
  const [mode, setMode] = useState<Mode>("home");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [sel, setSel] = useState(0);
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const onQuery = (v: string) => {
    setQuery(v);
    setSel(0);
    window.clearTimeout(timer.current);
    if (v.trim().length >= 2) {
      timer.current = window.setTimeout(() => {
        searchDirs(v)
          .then(setResults)
          .catch(() => setResults([]));
      }, 160);
    } else {
      setResults([]);
    }
  };

  const searchKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel((s) => Math.min(s + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[sel]) onOpen(results[sel]);
      else if (query.trim()) onOpen(query.trim());
    }
  };

  const browse = async () => {
    const s = await openDialog({ directory: true, multiple: false, title: "Open folder" });
    if (typeof s === "string") onOpen(s);
  };

  const pickParent = (title: string): Promise<string | null> =>
    openDialog({ directory: true, multiple: false, title }).then((s) =>
      typeof s === "string" ? s : null,
    );

  const doClone = async () => {
    if (!url.trim()) return;
    const parent = await pickParent("Clone into which folder?");
    if (!parent) return;
    setBusy(`Cloning ${url.trim()}…`);
    setErr(null);
    try {
      onOpen(await cloneRepo(url.trim(), parent));
    } catch (e) {
      setErr(String(e));
      setBusy(null);
    }
  };

  const doNew = async () => {
    if (!name.trim()) return;
    const parent = await pickParent("Create the project in which folder?");
    if (!parent) return;
    setBusy(`Creating ${name.trim()}…`);
    setErr(null);
    try {
      onOpen(await createProject(parent, name.trim()));
    } catch (e) {
      setErr(String(e));
      setBusy(null);
    }
  };

  const recentList = showAll ? recents : recents.slice(0, 5);

  return (
    <div className="welcome">
      <div className="wl-inner">
        <div className="wl-head wl-anim">
          <div className="wl-logo">◆</div>
          <h1 className="wl-brand">Vellum</h1>
          <p className="wl-tag">terminal + reactive spec / git surface</p>
        </div>

        {mode === "home" && (
          <>
            <div className="wl-grid wl-anim" style={{ animationDelay: "60ms" }}>
              <button className="wl-card" onClick={browse}>
                <span className="wl-card-ic">
                  <ActionIcon d={ICON.folder} />
                </span>
                <span className="wl-card-title">Open project</span>
              </button>
              <button className="wl-card" onClick={() => setMode("clone")}>
                <span className="wl-card-ic">
                  <ActionIcon d={ICON.git} />
                </span>
                <span className="wl-card-title">Clone repo</span>
              </button>
              <button className="wl-card" onClick={() => setMode("new")}>
                <span className="wl-card-ic">
                  <ActionIcon d={ICON.plus} />
                </span>
                <span className="wl-card-title">New project</span>
              </button>
              <button className="wl-card" onClick={() => setMode("search")}>
                <span className="wl-card-ic">
                  <ActionIcon d={ICON.search} />
                </span>
                <span className="wl-card-title">Search machine</span>
              </button>
            </div>

            {recents.length > 0 && (
              <div className="wl-recent wl-anim" style={{ animationDelay: "120ms" }}>
                <div className="wl-recent-head">
                  <span>Recent projects</span>
                  {recents.length > 5 && (
                    <button className="wl-viewall" onClick={() => setShowAll((v) => !v)}>
                      {showAll ? "Show less" : `View all (${recents.length})`}
                    </button>
                  )}
                </div>
                {recentList.map((p) => {
                  const base = p.split("/").pop() || p;
                  const parent = p.slice(0, p.length - base.length - 1);
                  return (
                    <button
                      key={p}
                      className="wl-recent-row"
                      onClick={() => onOpen(p)}
                      title={p}
                    >
                      <span className="wl-recent-name">{base}</span>
                      <span className="wl-recent-loc">{shortHome(parent) || "~"}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {mode === "search" && (
          <div className="wl-form wl-anim">
            <button className="wl-back" onClick={() => setMode("home")}>
              ‹ back
            </button>
            <div className="spot-search">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4">
                <circle cx="7" cy="7" r="4.5" />
                <path d="M11 11l3.5 3.5" strokeLinecap="round" />
              </svg>
              <input
                className="spot-input"
                placeholder="Search folders on your machine…  or paste a /path"
                value={query}
                onChange={(e) => onQuery(e.currentTarget.value)}
                onKeyDown={searchKey}
                autoFocus
              />
            </div>
            {results.length > 0 ? (
              <div className="spot-list">
                {results.map((p, i) => (
                  <button
                    key={p + i}
                    className={`spot-row ${i === sel ? "sel" : ""}`}
                    onMouseEnter={() => setSel(i)}
                    onClick={() => onOpen(p)}
                    title={p}
                  >
                    <FileIcon name={p} dir open={false} />
                    <span className="spot-name">{p.split("/").pop() || p}</span>
                    <span className="spot-path">{shortHome(p)}</span>
                  </button>
                ))}
              </div>
            ) : query.trim().length >= 2 ? (
              <div className="spot-empty">No matching folders</div>
            ) : null}
          </div>
        )}

        {mode === "clone" && (
          <div className="wl-form wl-anim">
            <button className="wl-back" onClick={() => setMode("home")}>
              ‹ back
            </button>
            <div className="wl-form-title">Clone repository</div>
            <input
              className="wl-input"
              placeholder="https://github.com/user/repo.git  or  git@github.com:user/repo.git"
              value={url}
              onChange={(e) => setUrl(e.currentTarget.value)}
              onKeyDown={(e) => e.key === "Enter" && doClone()}
              autoFocus
            />
            <p className="wl-hint">Uses your local git — SSH keys and credentials work.</p>
            <button className="btn primary big" onClick={doClone} disabled={!url.trim()}>
              Choose location & clone
            </button>
          </div>
        )}

        {mode === "new" && (
          <div className="wl-form wl-anim">
            <button className="wl-back" onClick={() => setMode("home")}>
              ‹ back
            </button>
            <div className="wl-form-title">New project</div>
            <input
              className="wl-input"
              placeholder="project-name"
              value={name}
              onChange={(e) => setName(e.currentTarget.value)}
              onKeyDown={(e) => e.key === "Enter" && doNew()}
              autoFocus
            />
            <p className="wl-hint">Creates the folder and runs git init.</p>
            <button className="btn primary big" onClick={doNew} disabled={!name.trim()}>
              Choose location & create
            </button>
          </div>
        )}

        {err && <div className="gate-err">{err}</div>}
      </div>

      {busy && (
        <div className="wl-busy">
          <div className="wl-spinner" />
          <span>{busy}</span>
        </div>
      )}
    </div>
  );
}
