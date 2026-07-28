import type { Metadata } from "next";
import Link from "next/link";
import Doc from "@/components/Doc";
import Code from "@/components/Code";

export const metadata: Metadata = {
  title: "Keyboard shortcuts",
  description: "The complete Slate keymap for views, terminal tabs and global commands.",
};

const TOC = [
  { id: "views", label: "Views" },
  { id: "terminal", label: "Terminal" },
  { id: "global", label: "Global" },
];

export default function Page() {
  return (
    <Doc
      kicker="Docs / Using Slate"
      title="Keyboard shortcuts"
      lead="The complete Slate keymap for views, terminal tabs and global commands."
      toc={TOC}
      prev={["/docs/views", "The six views"]}
      next={["/docs/config", "Configuration"]}
    >
<h2 id="views">Views</h2>
    <table>
      <thead><tr><th>Action</th><th>Keys</th></tr></thead>
      <tbody>
        <tr><td>Specs</td><td><kbd>⇧⌘E</kbd></td></tr>
        <tr><td>Changes</td><td><kbd>⌃⇧G</kbd></td></tr>
        <tr><td>Diff</td><td><kbd>⇧⌘D</kbd></td></tr>
        <tr><td>Search</td><td><kbd>⇧⌘F</kbd></td></tr>
        <tr><td>Activity</td><td><kbd>⇧⌘A</kbd></td></tr>
        <tr><td>Timeline</td><td><kbd>⇧⌘T</kbd></td></tr>
        <tr><td>Pin / unpin the current view</td><td><kbd>⌘.</kbd></td></tr>
      </tbody>
    </table>

    <h2 id="terminal">Terminal</h2>
    <table>
      <thead><tr><th>Action</th><th>Keys</th></tr></thead>
      <tbody>
        <tr><td>New terminal tab</td><td><kbd>⌘T</kbd></td></tr>
        <tr><td>Close terminal tab</td><td><kbd>⌘W</kbd></td></tr>
        <tr><td>Next / previous tab</td><td><kbd>⌃⇥</kbd> / <kbd>⌃⇧⇥</kbd></td></tr>
        <tr><td>Focus terminal</td><td><kbd>⌘1</kbd></td></tr>
        <tr><td>Focus pane B</td><td><kbd>⌘2</kbd></td></tr>
        <tr><td>Clear scrollback</td><td><kbd>⌘K</kbd></td></tr>
      </tbody>
    </table>

    <h2 id="global">Global</h2>
    <table>
      <thead><tr><th>Action</th><th>Keys</th></tr></thead>
      <tbody>
        <tr><td>Command palette</td><td><kbd>⌘P</kbd></td></tr>
        <tr><td>Open folder</td><td><kbd>⇧⌘O</kbd></td></tr>
        <tr><td>Settings</td><td><kbd>⌘,</kbd></td></tr>
        <tr><td>Cycle theme</td><td><kbd>⌃⌘T</kbd></td></tr>
        <tr><td>Approve / deny the pending prompt</td><td><kbd>⌘⏎</kbd> / <kbd>⌘⌫</kbd></td></tr>
      </tbody>
    </table>
    <div className="note">
      <span className="tag tag-sig">Conflicts</span>
      <p>Shortcuts are only intercepted when pane B has focus or the chord includes <kbd>⇧</kbd>. Anything your shell or TUI expects — <kbd>⌃C</kbd>, <kbd>⌃R</kbd>, <kbd>⌃A</kbd> — reaches the PTY untouched.</p>
    </div>
    </Doc>
  );
}
