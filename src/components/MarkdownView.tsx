import { useEffect, useMemo, useRef, useState } from "react";
import MarkdownIt from "markdown-it";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import { readAsset, readText } from "../lib/ipc";

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
  const [raw, setRaw] = useState<string>("");
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

  const html = useMemo(() => md.render(raw), [raw]);
  const bodyRef = useRef<HTMLDivElement>(null);

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
