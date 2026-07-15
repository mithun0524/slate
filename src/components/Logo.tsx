// The Slate mark: a rounded square (the surface) with a split line — the two
// panes (terminal | reactive view). Monochrome, uses currentColor.
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.3"
      strokeLinejoin="round"
    >
      <rect x="3.4" y="3.4" width="25.2" height="25.2" rx="7" />
      <path d="M12.5 4.2 V27.8" strokeWidth="2" opacity="0.85" />
    </svg>
  );
}
