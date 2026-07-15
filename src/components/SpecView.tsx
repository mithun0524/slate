import { useEffect, useState } from "react";
import { SpecTree } from "./SpecTree";
import { MarkdownView } from "./MarkdownView";

// The Spec surface: a markdown-file explorer (all repo .md) beside the renderer.
// `path` is the spec the reactive intent selected; the user can also pick any
// file from the tree. Auto-switching still wins when a new intent arrives.
export function SpecView({
  path,
  refreshKey,
}: {
  path: string;
  refreshKey: number;
}) {
  const [active, setActive] = useState(path);
  const [collapsed, setCollapsed] = useState(false);

  // Follow the reactive intent when it changes the target spec.
  useEffect(() => {
    setActive(path);
  }, [path]);

  return (
    <div className="view spec-view">
      {collapsed ? (
        <button
          className="spec-reveal"
          title="Show spec explorer"
          onClick={() => setCollapsed(false)}
        >
          ›
        </button>
      ) : (
        <div className="spec-side">
          <SpecTree active={active} refreshKey={refreshKey} onSelect={setActive} />
          <button
            className="spec-collapse"
            title="Hide spec explorer"
            onClick={() => setCollapsed(true)}
          >
            ‹
          </button>
        </div>
      )}
      <div className="spec-content">
        {active ? (
          <MarkdownView path={active} refreshKey={refreshKey} />
        ) : (
          <div className="view-empty">
            <svg
              className="empty-svg"
              viewBox="0 0 48 48"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
              strokeLinecap="round"
            >
              <path d="M12 5h16l8 8v30H12z" />
              <path d="M28 5v8h8" />
              <path d="M17 24h14M17 30h14M17 36h9" />
            </svg>
            <span>Select a spec from the explorer</span>
          </div>
        )}
      </div>
    </div>
  );
}
