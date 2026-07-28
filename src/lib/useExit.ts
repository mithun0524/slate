import { useCallback, useEffect, useState } from "react";

// Overlays animate in on mount but React unmounts them instantly, so the exit
// used to teleport. Call `close()` instead of the parent's onClose: it flips
// `closing` (drives the reverse animation), then unmounts after `ms`.
export function useExit(onClose: () => void, ms = 140) {
  const [closing, setClosing] = useState(false);
  const close = useCallback(() => setClosing(true), []);

  useEffect(() => {
    if (!closing) return;
    const t = window.setTimeout(onClose, ms);
    return () => window.clearTimeout(t);
  }, [closing, ms, onClose]);

  return { closing, close };
}
