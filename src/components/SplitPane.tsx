import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

// A horizontal resizable split: left pane | draggable divider | right pane.
// `initial` and the clamp bounds are fractions of total width (0..1).
export function SplitPane({
  left,
  right,
  initial = 0.5,
  min = 0.2,
  max = 0.8,
  onRatio,
}: {
  left: ReactNode;
  right: ReactNode;
  initial?: number;
  min?: number;
  max?: number;
  /// Fires when a drag ends, so the caller can persist the position.
  onRatio?: (r: number) => void;
}) {
  const [ratio, setRatio] = useState(initial);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  // endDrag is memoised; read the live ratio through a ref, not the closure.
  const ratioRef = useRef(ratio);
  ratioRef.current = ratio;

  // Adopt a new `initial` (switching workspace restores that one's layout)
  // unless the user is mid-drag.
  useEffect(() => {
    if (!dragging.current) setRatio(initial);
  }, [initial]);

  const onMove = useCallback(
    (clientX: number) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const r = (clientX - rect.left) / rect.width;
      setRatio(Math.min(max, Math.max(min, r)));
    },
    [min, max],
  );

  const [active, setActive] = useState(false);

  const startDrag = useCallback((e: React.PointerEvent) => {
    e.preventDefault(); // stop WKWebView from starting a native text selection
    dragging.current = true;
    setActive(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    document.body.classList.add("dragging-split");
    window.getSelection()?.removeAllRanges();
  }, []);

  const endDrag = useCallback(() => {
    // Only act on the end of an ACTUAL drag — this handler is on the container
    // and bubbles up from every click inside the pane (e.g. focusing an input).
    if (!dragging.current) return;
    dragging.current = false;
    setActive(false);
    document.body.classList.remove("dragging-split");
    window.getSelection()?.removeAllRanges();
    onRatio?.(ratioRef.current);
  }, [onRatio]);

  return (
    <div
      className={`split ${active ? "dragging" : ""}`}
      ref={containerRef}
      onPointerMove={(e) => dragging.current && onMove(e.clientX)}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <div className="split-pane" style={{ width: `${ratio * 100}%` }}>
        {left}
      </div>
      <div className="split-divider" onPointerDown={startDrag} />
      <div className="split-pane" style={{ width: `${(1 - ratio) * 100}%` }}>
        {right}
      </div>
    </div>
  );
}
