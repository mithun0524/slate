import { useEffect, useRef } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { onPtyData, onPtyExit, ptyResize, ptySpawn, ptyWrite } from "../lib/ipc";
import { THEMES, type ThemeId } from "../lib/themes";

function termColors(id: ThemeId) {
  const t = THEMES.find((x) => x.id === id) ?? THEMES[0];
  return {
    background: t.vars["--term-bg"] ?? t.vars["--bg-1"],
    foreground: t.vars["--fg"],
    cursor: t.vars["--accent"],
    selectionBackground: "#264f78",
  };
}

// Pane A: a real terminal wired to the Rust pty. Claude Code runs here.
export function Terminal({ themeId }: { themeId: ThemeId }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<XTerm | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const term = new XTerm({
      fontFamily: '"SF Mono", ui-monospace, Menlo, Consolas, monospace',
      fontSize: 13,
      cursorBlink: true,
      theme: termColors(themeId),
    });
    termRef.current = term;
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(host);
    fit.fit();

    let disposed = false;
    const unlisteners: Array<() => void> = [];

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
      termRef.current = null;
    };
  }, []);

  // Recolor live when the theme changes.
  useEffect(() => {
    if (termRef.current) termRef.current.options.theme = termColors(themeId);
  }, [themeId]);

  return <div className="terminal-host" ref={hostRef} />;
}
