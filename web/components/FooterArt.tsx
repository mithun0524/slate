/* Footer mark: the split, drawn in hairlines. A frame, a divider, a prompt,
   four lines. No glow, no glass, no motion. */

export default function FooterArt() {
  return (
    <svg className="fart" viewBox="0 0 420 240" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeOpacity=".16" strokeWidth="1">
        <rect x="20.5" y="20.5" width="379" height="199" rx="14" />
        <line x1="176" y1="21" x2="176" y2="220" />
      </g>

      {/* left: the prompt */}
      <path
        d="M52 108 l14 12 -14 12"
        stroke="currentColor" strokeOpacity=".5" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"
      />
      <line x1="76" y1="132" x2="126" y2="132" stroke="currentColor" strokeOpacity=".18" strokeWidth="2" />

      {/* right: what the pane resolved to */}
      <g strokeWidth="2" strokeLinecap="round">
        <line x1="208" y1="96" x2="316" y2="96" stroke="currentColor" strokeOpacity=".22" />
        <line x1="208" y1="120" x2="352" y2="120" stroke="#4ac26b" strokeOpacity=".45" />
        <line x1="208" y1="144" x2="288" y2="144" stroke="currentColor" strokeOpacity=".14" />
      </g>
    </svg>
  );
}
