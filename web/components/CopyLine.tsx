"use client";

import { useState } from "react";

export default function CopyLine({ value }: { value: string }) {
  const [done, setDone] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      setTimeout(() => setDone(false), 1600);
    } catch {
      /* clipboard blocked — the command is on screen anyway */
    }
  };

  return (
    <div className={`copyline ${done ? "done" : ""}`}>
      <code>{value}</code>
      <button type="button" onClick={copy} aria-label={`Copy: ${value}`}>
        {done ? "copied" : "copy"}
      </button>
    </div>
  );
}
