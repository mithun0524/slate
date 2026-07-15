import type { ViewIntent } from "../lib/ipc";
import { MarkdownView } from "./MarkdownView";
import { TreeView } from "./TreeView";
import { DiffView } from "./DiffView";

// Pane B: renders whichever view the current intent selects. `seq` bumps on
// every applied intent to force data re-fetches in the child views.
export function PanelB({
  intent,
  seq,
  onSelectFile,
}: {
  intent: ViewIntent;
  seq: number;
  onSelectFile: (path: string) => void;
}) {
  switch (intent.kind) {
    case "spec":
      return <MarkdownView path={intent.path} refreshKey={seq} />;
    case "diff":
      return <DiffView paths={intent.paths} refreshKey={seq} />;
    case "tree":
    default:
      return <TreeView refreshKey={seq} onSelect={onSelectFile} />;
  }
}
