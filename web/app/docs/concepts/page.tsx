import type { Metadata } from "next";
import Link from "next/link";
import Doc from "@/components/Doc";
import Code from "@/components/Code";

export const metadata: Metadata = {
  title: "Concepts",
  description: "Bursts, intents, the classifier and the source — the four ideas behind Slate's reactive pane.",
};

const TOC = [
  { id: "burst", label: "The burst" },
  { id: "intent", label: "The intent" },
  { id: "classifier", label: "The classifier" },
  { id: "source", label: "The source" },
  { id: "replay", label: "Replay" },
];

export default function Page() {
  return (
    <Doc
      kicker="Docs / Start"
      title="Concepts"
      lead="Bursts, intents, the classifier and the source — the four ideas behind Slate's reactive pane."
      toc={TOC}
      prev={["/docs", "Getting started"]}
      next={["/docs/views", "The six views"]}
    >
<h2 id="burst">The burst</h2>
    <p>A single agent action produces dozens of filesystem events — a write, a rename of a temp file, a formatter pass, a test runner touching a cache. Reacting to each one would make the pane strobe.</p>
    <p>Slate collects events into a <strong>burst</strong>: everything that lands within a 90 ms quiet window, gitignore-filtered, deduplicated by path. One burst means "the agent just did a thing".</p>
    <Code className="pre" code={`// types.rs
pub struct FileBurst {
    pub events: Vec<FileChange>,   // path + Created | Modified | Deleted
}`} />

    <h2 id="intent">The intent</h2>
    <p>A burst is turned into a <strong>ViewIntent</strong> — the pane&apos;s instruction for what to render.</p>
    <table>
      <thead><tr><th>Intent</th><th>Renders</th></tr></thead>
      <tbody>
        <tr><td><code>Spec {"{"} path {"}"}</code></td><td>That markdown file, rendered</td></tr>
        <tr><td><code>Diff {"{"} paths {"}"}</code></td><td>Unified diff of exactly those files</td></tr>
        <tr><td><code>Tree</code></td><td>Working-tree status</td></tr>
        <tr><td><code>Log</code></td><td>Commit history</td></tr>
        <tr><td><code>Search</code></td><td>The search surface</td></tr>
      </tbody>
    </table>

    <h2 id="classifier">The classifier</h2>
    <p>One pure function maps a burst to an intent. It is I/O-free so it can be unit-tested in isolation, and it runs in microseconds.</p>
    <Code className="pre" code={`// classifier.rs — rules, in priority order
// 1. markdown created, or markdown dominates the burst
if md_created || md_live.len() >= non_md {
    return ViewIntent::Spec { path: last_markdown }
}
// 2. structure changed more than content
if structural >= 2 && structural >= modified.len() {
    return ViewIntent::Tree
}
// 3. otherwise: the files that changed
if !modified.is_empty() {
    return ViewIntent::Diff { paths: modified }
}
ViewIntent::Tree`} />
    <p>Two consequences worth internalising. A spec merely <em>touched</em> during a code edit does not hijack the pane — code has to be the minority for spec to win. And a burst of pure renames reads as structural, so you get the tree rather than a diff of nothing.</p>
    <div className="note">
      <span className="tag tag-sig">Why not a model</span>
      <p>An LLM here would add latency, cost and nondeterminism to a decision that is three <code>if</code> statements. The pane has to be right before you finish looking up.</p>
    </div>

    <h2 id="source">The source</h2>
    <p>Every switch is attributed in the pane header, so you always know why you are looking at something:</p>
    <ul>
      <li><code>classifier</code> — Slate inferred it from a burst.</li>
      <li><code>override</code> — an agent asked for it via the <Link className="link" href="/docs/api/">override API</Link>.</li>
      <li><code>manual</code> — you clicked or pressed a shortcut.</li>
    </ul>
    <p>A manual choice suppresses auto-switching for a short window; <kbd>⌘.</kbd> suppresses it indefinitely.</p>

    <h2 id="replay">Replay</h2>
    <p>The last 20 bursts keep their diff snapshot in memory. The Activity and Timeline views let you scrub back and re-open any of them — useful precisely when a change from ten minutes ago turns out to be the culprit.</p>
    </Doc>
  );
}
