import type { Metadata } from "next";
import Link from "next/link";
import Doc from "@/components/Doc";
import Code from "@/components/Code";

export const metadata: Metadata = {
  title: "Override API",
  description: "Let your agent drive the pane with one curl to the loopback listener on port 8477.",
};

const TOC = [
  { id: "enable", label: "Enable it" },
  { id: "endpoint", label: "POST /intent" },
  { id: "hooks", label: "Wiring it to an agent" },
  { id: "notes", label: "Notes" },
];

export default function Page() {
  return (
    <Doc
      kicker="Docs / Extending"
      title="Override API"
      lead="Let your agent drive the pane with one curl to the loopback listener on port 8477."
      toc={TOC}
      prev={["/docs/config", "Configuration"]}
      next={["/docs/troubleshooting", "Troubleshooting"]}
    >
<h2 id="enable">Enable it</h2>
    <Code className="pre" code={`# ~/.config/slate/config.toml
[override]
enabled = true
port    = 8477`} />
    <p>The listener binds to <code>127.0.0.1</code> exclusively. It is never exposed on <code>0.0.0.0</code>, there is no remote mode, and Slate refuses to start it if the port is already bound.</p>

    <h2 id="endpoint">POST /intent</h2>
    <p>One endpoint. The body is a <code>ViewIntent</code>.</p>
    <Code className="pre" code={`curl -s localhost:8477/intent \\
  -H 'content-type: application/json' \\
  -d '{"kind":"spec","path":"docs/retry.md"}'`} />
    <table>
      <thead><tr><th>Body</th><th>Effect</th></tr></thead>
      <tbody>
        <tr><td><code>{"{"}"kind":"spec","path":"…"{"}"}</code></td><td>Render that markdown file</td></tr>
        <tr><td><code>{"{"}"kind":"diff","paths":["…"]{"}"}</code></td><td>Diff those files</td></tr>
        <tr><td><code>{"{"}"kind":"tree"{"}"}</code></td><td>Working-tree status</td></tr>
        <tr><td><code>{"{"}"kind":"log"{"}"}</code></td><td>Commit history</td></tr>
        <tr><td><code>{"{"}"kind":"search"{"}"}</code></td><td>Search surface</td></tr>
      </tbody>
    </table>
    <p>Responses are <code>204 No Content</code> on success, <code>400</code> for a malformed intent, <code>404</code> when a path does not exist inside the open workspace. Paths outside the workspace are rejected, not clamped.</p>

    <h2 id="hooks">Wiring it to an agent</h2>
    <p>Any hook mechanism works. With Claude Code, a post-edit hook is two lines:</p>
    <Code className="pre" code={`#!/usr/bin/env bash
# .claude/hooks/post_edit.sh
curl -s --max-time 1 localhost:8477/intent \\
  -d "{\\"kind\\":\\"diff\\",\\"paths\\":[\\"$CLAUDE_FILE\\"]}" || true`} />
    <div className="note">
      <span className="tag tag-sig">Fail open</span>
      <p>Always append <code>|| true</code> and a short timeout. A hook that blocks because Slate is not running is a worse outcome than a pane that did not switch.</p>
    </div>

    <h2 id="notes">Notes</h2>
    <ul>
      <li>An override wins over the classifier until the next manual interaction.</li>
      <li>Overrides are rate-limited to 20/second; the excess is dropped, not queued.</li>
      <li>The pane header shows <code>override</code> so you can tell agent-driven switches from inferred ones.</li>
    </ul>
    </Doc>
  );
}
