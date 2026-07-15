import { useEffect, useRef } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import {
  onPtyData,
  onPtyExit,
  ptyResize,
  ptySpawn,
  ptyWrite,
} from "../lib/ipc";

// Pane A: a real terminal wired to the Rust pty. Claude Code runs here.
export function Terminal() {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const term = new XTerm({
      fontFamily:
        'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
      fontSize: 13,
      cursorBlink: true,
      theme: {
        background: "#1e1e1e",
        foreground: "#cccccc",
        cursor: "#e2b23c",
        selectionBackground: "#264f78",
      },
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(host);
    fit.fit();

    let disposed = false;
    const unlisteners: Array<() => void> = [];

    // Wire the streams BEFORE spawning, otherwise output the shell emits
    // between spawn and listener-registration (prompt, banner) is lost.
    (async () => {
      try {
        const offData = await onPtyData((chunk) => term.write(chunk));
        const offExit = await onPtyExit((code) =>
          term.write(`\r\n\x1b[90m[process exited: ${code}]\x1b[0m\r\n`),
        );
        if (disposed) {
          offData();
          offExit();
          return;
        }
        unlisteners.push(offData, offExit);
        await ptySpawn(term.cols, term.rows);
      } catch (e) {
        term.write(`\r\n\x1b[31m[pty error: ${e}]\x1b[0m\r\n`);
      }
    })();

    const offInput = term.onData((data) => {
      ptyWrite(data).catch(() => {});
    });

    const ro = new ResizeObserver(() => {
      try {
        fit.fit();
        ptyResize(term.cols, term.rows).catch(() => {});
      } catch {
        /* ignore transient resize errors */
      }
    });
    ro.observe(host);

    return () => {
      disposed = true;
      ro.disconnect();
      offInput.dispose();
      unlisteners.forEach((fn) => fn());
      term.dispose();
    };
  }, []);

  return <div className="terminal-host" ref={hostRef} />;
}
