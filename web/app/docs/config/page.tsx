import type { Metadata } from "next";
import Link from "next/link";
import Doc from "@/components/Doc";
import Code from "@/components/Code";

export const metadata: Metadata = {
  title: "Configuration",
  description: "The optional config.toml: watcher debounce, ignores, pane behaviour, themes and the CLI.",
};

const TOC = [
  { id: "file", label: "The config file" },
  { id: "themes", label: "Themes" },
  { id: "cli", label: "CLI" },
  { id: "ignore", label: "Keeping the watcher quiet" },
];

export default function Page() {
  return (
    <Doc
      kicker="Docs / Using Slate"
      title="Configuration"
      lead="The optional config.toml: watcher debounce, ignores, pane behaviour, themes and the CLI."
      toc={TOC}
      prev={["/docs/shortcuts", "Keyboard shortcuts"]}
      next={["/docs/api", "Override API"]}
    >
<h2 id="file">The config file</h2>
    <p>Settings live in one TOML file. It is created on first change, never on install.</p>
    <Code className="pre" code={`# ~/.config/slate/config.toml

[watcher]
debounce_ms   = 90       # quiet window that closes a burst
ignore        = ["dist/**", "*.log"]
follow_gitignore = true

[pane]
default       = "tree"   # spec | diff | tree | log | search
auto_switch   = true
manual_hold_ms = 4000    # how long a click suppresses auto-switch
replay_depth  = 20

[terminal]
shell         = ""       # empty = $SHELL
font_size     = 13
scrollback    = 10000

[override]
enabled       = false    # the loopback API, off by default
port          = 8477

[theme]
name          = "slate-dark"   # slate-dark | slate-light | paper | mono`} />

    <h2 id="themes">Themes</h2>
    <p>Four built-ins ship with the app; <kbd>⌃⌘T</kbd> cycles them. A theme is a flat list of CSS custom properties, so a custom one is a single file dropped in <code>~/.config/slate/themes/</code>.</p>

    <h2 id="cli">CLI</h2>
    <table>
      <thead><tr><th>Command</th><th>Does</th></tr></thead>
      <tbody>
        <tr><td><code>slate .</code></td><td>Open the current directory</td></tr>
        <tr><td><code>slate --new &lt;name&gt;</code></td><td>Create and open a project</td></tr>
        <tr><td><code>slate --clone &lt;url&gt;</code></td><td>Clone, then open</td></tr>
        <tr><td><code>slate --config</code></td><td>Print the resolved config and exit</td></tr>
      </tbody>
    </table>

    <h2 id="ignore">Keeping the watcher quiet</h2>
    <p>Slate follows <code>.gitignore</code> by default. Build outputs that are tracked — generated clients, lockfiles a formatter rewrites — belong in <code>watcher.ignore</code>, otherwise a build will pull the pane onto a diff you did not ask for.</p>
    </Doc>
  );
}
