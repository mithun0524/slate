import type { Metadata } from "next";
import Link from "next/link";
import Doc from "@/components/Doc";
import Code from "@/components/Code";

export const metadata: Metadata = {
  title: "Troubleshooting",
  description: "Pane not switching, wrong view, high CPU, inotify limits and how to file a useful bug.",
};

const TOC = [
  { id: "not-switching", label: "Pane never switches" },
  { id: "wrong-view", label: "Wrong view" },
  { id: "cpu", label: "High CPU" },
  { id: "shell", label: "Missing prompt" },
  { id: "override-dead", label: "Override API dead" },
  { id: "logs", label: "Logs" },
  { id: "filing", label: "Filing a bug" },
];

export default function Page() {
  return (
    <Doc
      kicker="Docs / Help"
      title="Troubleshooting"
      lead="Pane not switching, wrong view, high CPU, inotify limits and how to file a useful bug."
      toc={TOC}
      prev={["/docs/api", "Override API"]}
      next={["/changelog", "Changelog"]}
    >
<h2 id="not-switching">The pane never switches</h2>
    <ul>
      <li>Check the pin indicator in the status bar — <kbd>⌘.</kbd> toggles it, and it is sticky by design.</li>
      <li>Confirm the files are not gitignored. Slate follows <code>.gitignore</code>, so writes into an ignored path produce no burst.</li>
      <li>On Linux, a low <code>fs.inotify.max_user_watches</code> silently drops events in large repos:
        <Code className="pre" code={`sysctl fs.inotify.max_user_watches   # 8192 is too low
sudo sysctl -w fs.inotify.max_user_watches=524288`} />
      </li>
    </ul>

    <h2 id="wrong-view">It switches to the wrong view</h2>
    <p>Usually a build or formatter is writing alongside your agent, so the burst is dominated by files you did not intend. Add them to <code>watcher.ignore</code> — see <Link className="link" href="/docs/config/#ignore">configuration</Link>. If the classifier is genuinely wrong for a case you can reproduce, that is a bug worth filing; it is deterministic, so a burst description is enough to reproduce it.</p>

    <h2 id="cpu">High CPU</h2>
    <p>Almost always a watch loop: a process writing inside the working tree continuously (a dev server writing to <code>.cache</code>, a test watcher). Slate shows the burst rate in the status bar — if it never drops to zero while you are idle, something is writing.</p>

    <h2 id="shell">My prompt or aliases are missing</h2>
    <p>Slate launches <code>$SHELL</code> as a login shell. If your configuration lives in a non-login file, either move it or set <code>terminal.shell</code> explicitly in the config.</p>

    <h2 id="override-dead">The override API does nothing</h2>
    <ul>
      <li><code>override.enabled</code> defaults to <code>false</code>. Turn it on.</li>
      <li>Check the port is actually bound: <code>curl -sv localhost:8477/intent -d &apos;{"{"}"kind":"tree"{"}"}&apos;</code>.</li>
      <li>Paths must be inside the open workspace and must exist.</li>
    </ul>

    <h2 id="logs">Logs and diagnostics</h2>
    <Code className="pre" code={`slate --config          # resolved configuration
tail -f ~/.local/state/slate/slate.log`} />
    <p>Logs are local files. Nothing is uploaded, so a bug report needs you to attach them deliberately — see <Link className="link" href="/privacy/">privacy</Link>.</p>

    <h2 id="filing">Filing a bug</h2>
    <p>Include the Slate version, OS, the burst that misbehaved (file list and change kinds), and what you expected the pane to show. Because the classifier is pure, that is enough to write a failing test.</p>
    </Doc>
  );
}
