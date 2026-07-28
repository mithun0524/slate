import type { Metadata } from "next";
import Link from "next/link";
import Doc from "@/components/Doc";
import Code from "@/components/Code";

export const metadata: Metadata = {
  title: "Getting started",
  description:
    "Install Slate, open a repository, run your agent, and read the reactive pane. The five-minute version.",
};

const TOC = [
  { id: "install", label: "Install" },
  { id: "open", label: "Open a repository" },
  { id: "run", label: "Run your agent" },
  { id: "read", label: "Read the pane" },
  { id: "takeover", label: "Take over" },
];

export default function Page() {
  return (
    <Doc
      kicker="Docs / Start"
      title="Getting started"
      lead="Install, open a repo, run your agent. Slate has no configuration step and no project file — this page is the whole onboarding."
      toc={TOC}
      prev={["/download", "Download"]}
      next={["/docs/concepts", "Concepts"]}
    >
      <h2 id="install">Install</h2>
      <p>Homebrew is the shortest path on macOS:</p>
      <Code className="pre" code={`brew install --cask slate`} />
      <p>
        Or take a <Link className="link" href="/download">direct download</Link> — a{" "}
        <code>.dmg</code> for macOS, an AppImage or <code>.deb</code> for Linux. Every build is
        12–15 MB and installs in one step.
      </p>
      <div className="note">
        <span className="tag">No account</span>
        <p>
          There is no sign-in, no licence key and no first-run wizard. If a screen asks you for an
          email address, you are not running Slate.
        </p>
      </div>

      <h2 id="open">Open a repository</h2>
      <p>Launch Slate and pick a folder, or open one from your shell:</p>
      <Code className="pre" code={`slate .            # the current directory\nslate ~/code/api   # any path`} />
      <p>
        On open, Slate reads your git state and starts a filesystem watcher scoped to the working
        tree. Ignored paths from <code>.gitignore</code> are skipped, so <code>node_modules</code>{" "}
        and <code>target</code> never generate events.
      </p>

      <h2 id="run">Run your agent</h2>
      <p>
        The left pane is a real PTY running your login shell — dotfiles, prompt, aliases and
        completions all work. Start whatever you already use:
      </p>
      <Code className="pre" code={`claude\ncodex\naider --model sonnet`} />
      <p>
        Slate does not wrap, parse or proxy the agent. It only watches what lands on disk, which is
        why it works with tools that did not exist when it was built.
      </p>

      <h2 id="read">Read the pane</h2>
      <table>
        <thead>
          <tr><th>What the agent did</th><th>What you see</th></tr>
        </thead>
        <tbody>
          <tr><td>Created or edited a markdown file</td><td><strong>Spec</strong> — rendered, highlighted</td></tr>
          <tr><td>Created or deleted several files</td><td><strong>Tree</strong> — with status letters</td></tr>
          <tr><td>Edited code</td><td><strong>Diff</strong> — of exactly those files</td></tr>
        </tbody>
      </table>
      <p>
        The source of the current view sits in the pane header: <code>classifier</code> when Slate
        decided, <code>override</code> when your agent asked, <code>manual</code> when you clicked.
      </p>

      <h2 id="takeover">Take over whenever</h2>
      <p>
        Click any tab and auto-switching pauses briefly so your click is not overridden a second
        later. Press <kbd>⌘.</kbd> to pin the current view — auto-switching stops entirely until you
        unpin.
      </p>
      <blockquote>
        The classifier is a convenience, not an authority. Anything it decides, you overrule in one
        keystroke.
      </blockquote>
    </Doc>
  );
}
