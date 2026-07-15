import { Logo } from "./Logo";
import { Search } from "lucide-react";

// Top chrome: brand + cwd breadcrumb (left), Cursor-style center command pill.
export function TitleBar({
  cwd,
  onCommand,
}: {
  cwd: string;
  onCommand: () => void;
}) {
  const parts = cwd.split("/").filter(Boolean);
  const name = parts[parts.length - 1] || "/";
  const crumb = parts.slice(-3);

  return (
    <div className="title-bar" data-tauri-drag-region>
      <div className="tb-left">
        <Logo className="tb-logo" />
        <span className="tb-brand">Slate</span>
        <span className="tb-sep">—</span>
        <span className="tb-ws">{name}</span>
        <span className="tb-crumb">
          {crumb.map((p, i) => (
            <span key={i}>
              {i > 0 && <span className="tb-slash">/</span>}
              {p}
            </span>
          ))}
        </span>
      </div>

      <button className="tb-command" onClick={onCommand} title="Command palette (⌘K)">
        <Search size={13} />
        <span className="tb-command-label">{name}</span>
        <span className="tb-kbd">⌘K</span>
      </button>

      <div className="tb-right" />
    </div>
  );
}
