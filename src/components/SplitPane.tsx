import { useCallback, useRef, useState, type ReactNode } from "react";

// A horizontal resizable split: left pane | draggable divider | right pane.
// `initial` and the clamp bounds are fractions of total width (0..1).
export function SplitPane({
  left,
  right,
  initial = 0.5,
  min = 0.2,
  max = 0.8,
}: {
  left: ReactNode;
  right: ReactNode;
  initial?: number;
  min?: number;
  max?: number;
}) {
  const [ratio, setRatio] = useState(initial);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

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
    dragging.current = true;
    setActive(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
    window.getSelection()?.removeAllRanges();
  }, []);

  const endDrag = useCallback(() => {
    dragging.current = false;
    setActive(false);
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
    window.getSelection()?.removeAllRanges();
  }, []);

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
