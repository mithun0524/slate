import {
  FileText,
  GitBranch,
  GitCompareArrows,
  History,
  Search,
  Settings,
} from "lucide-react";

export type ActItem = "specs" | "changes" | "diff" | "timeline" | "search";

const MAP: Record<string, typeof FileText> = {
  specs: FileText,
  changes: GitBranch,
  diff: GitCompareArrows,
  timeline: History,
  search: Search,
  settings: Settings,
};

// Named icon, sized by the consuming CSS (svg width/height).
export function Icon({ name }: { name: string }) {
  const C = MAP[name] ?? FileText;
  return <C strokeWidth={1.75} />;
}
