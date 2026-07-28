import type { Metadata } from "next";
import Link from "next/link";
import Doc from "@/components/Doc";
import Code from "@/components/Code";

export const metadata: Metadata = {
  title: "The six views",
  description: "Specs, changes, diff, search, activity and timeline: what each pane shows and its shortcut.",
};

const TOC = [
  { id: "specs", label: "Specs" },
  { id: "changes", label: "Changes" },
  { id: "diff", label: "Diff" },
  { id: "search", label: "Search" },
  { id: "activity", label: "Activity" },
  { id: "timeline", label: "Timeline" },
  { id: "layout", label: "Layout" },
];

export default function Page() {
  return (
    <Doc
      kicker="Docs / Using Slate"
      title="The six views"
      lead="Specs, changes, diff, search, activity and timeline: what each pane shows and its shortcut."
      toc={TOC}
      prev={["/docs/concepts", "Concepts"]}
      next={["/docs/shortcuts", "Keyboard shortcuts"]}
    >
<h2 id="specs">Specs <kbd>⇧⌘E</kbd></h2>
    <p>Markdown rendered with syntax-highlighted code fences, plus a file tree of every markdown file in the repo. Long file names scroll horizontally rather than truncating, because <code>docs/rfcs/0042-retry-policy.md</code> and <code>docs/rfcs/0043-retry-policy.md</code> are not the same document.</p>

    <h2 id="changes">Changes <kbd>⌃⇧G</kbd></h2>
    <p>Working-tree status with staged and unstaged groups, inline stage and unstage, and a commit box. Status letters follow git: <code>A</code> added, <code>M</code> modified, <code>D</code> deleted, <code>R</code> renamed, <code>?</code> untracked, <code>U</code> conflicted.</p>

    <h2 id="diff">Diff <kbd>⇧⌘D</kbd></h2>
    <p>A unified diff of the files in the current burst — not the whole tree. Word-level highlighting inside changed lines, and per-hunk stage buttons.</p>

    <h2 id="search">Search <kbd>⇧⌘F</kbd></h2>
    <p>Repository search with match context, grouped by file. Enter jumps to the match; the terminal keeps focus so you can keep typing to your agent.</p>

    <h2 id="activity">Activity <kbd>⇧⌘A</kbd></h2>
    <p>Every burst as a row: timestamp, file count, the intent it produced. Selecting a row re-opens the snapshot that burst produced — this is the replay surface.</p>

    <h2 id="timeline">Timeline <kbd>⇧⌘T</kbd></h2>
    <p>Commits and bursts on a single axis so you can see which changes happened inside which commit, and which are still uncommitted.</p>

    <h2 id="layout">Layout</h2>
    <p>Drag the divider to resize; the ratio is remembered per workspace. Terminals are tabbed — <kbd>⌘T</kbd> for a new one, <kbd>⌃⇥</kbd> to cycle. Every view is keyboard reachable and every interactive element is a real focusable control.</p>
    </Doc>
  );
}
