// The Slate mark: a window (the surface) with a filled left pane — the two
// panes (terminal | reactive view). Monochrome, uses currentColor.
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinejoin="round"
    >
      <rect x="3.6" y="3.6" width="24.8" height="24.8" rx="7" />
      <rect x="7" y="7.4" width="6" height="17.2" rx="2" fill="currentColor" stroke="none" />
    </svg>
  );
}
