import type { ViewIntent } from "../lib/ipc";
import { SpecView } from "./SpecView";
import { SourceControl } from "./SourceControl";
import { DiffView } from "./DiffView";
import { TimelineView } from "./TimelineView";
import { SearchView } from "./SearchView";
import { ActivityFeed, type ActivityEntry } from "./ActivityFeed";

// Pane B: renders whichever view the current intent selects. `seq` bumps on
// every applied intent to force data re-fetches in the child views.
export function PanelB({
  intent,
  seq,
  onSelectFile,
  onGitChanged,
  history,
  onReplay,
  onClearHistory,
}: {
  intent: ViewIntent;
  seq: number;
  onSelectFile: (path: string) => void;
  onGitChanged: () => void;
  history: ActivityEntry[];
  onReplay: (entry: ActivityEntry) => void;
  onClearHistory: () => void;
}) {
  switch (intent.kind) {
    case "spec":
      return <SpecView path={intent.path} refreshKey={seq} />;
    case "diff":
      return <DiffView paths={intent.paths} refreshKey={seq} />;
    case "log":
      return <TimelineView refreshKey={seq} />;
    case "search":
      return <SearchView />;
    case "activity":
      return <ActivityFeed history={history} onReplay={onReplay} onClear={onClearHistory} />;
    case "tree":
    default:
      return <SourceControl refreshKey={seq} onSelect={onSelectFile} onChanged={onGitChanged} />;
  }
}
