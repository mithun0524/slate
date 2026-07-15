import { useEffect, useMemo, useState } from "react";
import MarkdownIt from "markdown-it";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";
import { readText } from "../lib/ipc";

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

  return (
    <div className="view md-view">
      <div className="view-crumb">{path}</div>
      {err ? (
        <div className="view-empty">Cannot read file: {err}</div>
      ) : (
        <div
          className="markdown-body"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      )}
    </div>
  );
}
