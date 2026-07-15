import type { ViewIntent } from "../lib/ipc";
import { SpecView } from "./SpecView";
import { TreeView } from "./TreeView";
import { DiffView } from "./DiffView";
import { TimelineView } from "./TimelineView";

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
      return <SpecView path={intent.path} refreshKey={seq} />;
    case "diff":
      return <DiffView paths={intent.paths} refreshKey={seq} />;
    case "log":
      return <TimelineView refreshKey={seq} />;
    case "tree":
    default:
      return <TreeView refreshKey={seq} onSelect={onSelectFile} />;
  }
}
