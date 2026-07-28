import { useEffect, useMemo, useRef, useState } from "react";
import MarkdownIt from "markdown-it";
// `lib/common` = ~40 common languages instead of all ~190 (bundle: -700KB).
import hljs from "highlight.js/lib/common";
import "highlight.js/styles/github-dark.css";
import { readAsset, readText, writeText } from "../lib/ipc";

// Turn GitHub task-list items into interactive checkboxes carrying their index.
function injectTasks(src: string): string {
  let ti = 0;
  return src.replace(
    /^(\s*[-*] )\[([ xX])\](\s+.*)$/gm,
    (_m, pre: string, mark: string, rest: string) => {
      const checked = mark.toLowerCase() === "x";
      const idx = ti++;
      return `${pre}<input type="checkbox" class="task-cb" data-ti="${idx}"${checked ? " checked" : ""}/>${rest}`;
    },
  );
}

// Flip the Nth task marker in the raw source.
function flipTask(src: string, target: number): string {
  let ti = 0;
  return src.replace(/^(\s*[-*] )\[([ xX])\]/gm, (m, pre: string, mark: string) => {
    const idx = ti++;
    if (idx !== target) return m;
    const nc = mark.toLowerCase() === "x" ? " " : "x";
    return `${pre}[${nc}]`;
  });
}

const md = new MarkdownIt({
  // Render embedded HTML (README logos, shields badges, <p align>, tables).
  // Files are the user's own workspace content — trusted, like GitHub's viewer.
  html: true,
  linkify: true,
  typographer: true,
  highlight: (code, lang) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value;
      } catch {
        /* fall through */
      }
    }
    return "";
  },
});

// Renders a markdown/spec file. Re-reads whenever `path` changes (the watcher
// fires a fresh intent on every edit, which remounts/updates this).
export function MarkdownView({
  path,
  refreshKey,
}: {
  path: string;
  refreshKey: number;
}) {
  // null = first load pending; "" would paint an empty document for a frame.
  const [raw, setRaw] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    readText(path)
      .then((t) => alive && (setRaw(t), setErr(null)))
      .catch((e) => alive && setErr(String(e)));
    return () => {
      alive = false;
    };
    // refreshKey bumps on every re-emitted intent so editing the *currently
    // shown* spec re-reads it (same path would otherwise skip the effect).
  }, [path, refreshKey]);

  const html = useMemo(() => md.render(injectTasks(raw ?? "")), [raw]);
  const bodyRef = useRef<HTMLDivElement>(null);

  // Wire task-list checkboxes: toggle -> flip source line -> write file.
  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    const cbs = Array.from(body.querySelectorAll<HTMLInputElement>("input.task-cb"));
    const onToggle = (e: Event) => {
      const el = e.currentTarget as HTMLInputElement;
      const ti = Number(el.getAttribute("data-ti"));
      const next = flipTask(raw ?? "", ti);
      setRaw(next); // optimistic
      writeText(path, next).catch(() => setRaw(raw)); // revert on failure
    };
    cbs.forEach((cb) => cb.addEventListener("change", onToggle));
    return () => cbs.forEach((cb) => cb.removeEventListener("change", onToggle));
  }, [html, raw, path]);

  // The webview can't fetch workspace-relative <img> paths. After render,
  // resolve them (relative to the spec file's directory) to data: URLs.
  useEffect(() => {
    const body = bodyRef.current;
    if (!body) return;
    let alive = true;
    const baseDir = path.includes("/")
      ? path.slice(0, path.lastIndexOf("/"))
      : "";
    const imgs = Array.from(body.querySelectorAll("img"));
    for (const img of imgs) {
      const src = img.getAttribute("src") || "";
      if (/^(https?:|data:|asset:|tauri:)/i.test(src)) continue;
      let rel = src.replace(/^\.\//, "");
      rel = rel.startsWith("/") ? rel.slice(1) : baseDir ? `${baseDir}/${rel}` : rel;
      readAsset(rel)
        .then((url) => alive && img.setAttribute("src", url))
        .catch(() => {
          /* leave broken-image icon */
        });
    }
    return () => {
      alive = false;
    };
  }, [html, path]);

  if (raw === null && !err) return null;

  return (
    <div className="view md-view">
      <div className="view-crumb">
        <span className="crumb-label">{path}</span>
      </div>
      {err ? (
        <div className="view-empty">Cannot read file: {err}</div>
      ) : (
        <div
          className="markdown-body"
          ref={bodyRef}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </div>
  );
}
