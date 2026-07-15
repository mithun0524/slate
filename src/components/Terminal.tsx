import { useEffect, useRef } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { onPtyData, onPtyExit, ptyClose, ptyResize, ptySpawn, ptyWrite } from "../lib/ipc";
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

// One terminal tab, bound to pty session `id`. Claude Code runs here.
export function Terminal({
  id,
  themeId,
  active,
}: {
  id: string;
  themeId: ThemeId;
  active: boolean;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<XTerm | null>(null);
  const fitRef = useRef<FitAddon | null>(null);

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
    fitRef.current = fit;
    term.loadAddon(fit);
    term.open(host);
    try {
      fit.fit();
    } catch {
      /* hidden on mount */
    }

    let disposed = false;
    const unlisteners: Array<() => void> = [];

    (async () => {
      try {
        const offData = await onPtyData((p) => p.id === id && term.write(p.data));
        const offExit = await onPtyExit(
          (p) => p.id === id && term.write(`\r\n\x1b[90m[process exited: ${p.code}]\x1b[0m\r\n`),
        );
        if (disposed) {
          offData();
          offExit();
          return;
        }
        unlisteners.push(offData, offExit);
        await ptySpawn(id, term.cols, term.rows);
      } catch (e) {
        term.write(`\r\n\x1b[31m[pty error: ${e}]\x1b[0m\r\n`);
      }
    })();

    const offInput = term.onData((data) => {
      ptyWrite(id, data).catch(() => {});
    });

    const ro = new ResizeObserver(() => {
      try {
        fit.fit();
        ptyResize(id, term.cols, term.rows).catch(() => {});
      } catch {
        /* ignore transient */
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
      ptyClose(id).catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Refit + focus when this tab becomes active (it may have been hidden).
  useEffect(() => {
    if (!active) return;
    const term = termRef.current;
    const fit = fitRef.current;
    if (!term || !fit) return;
    const t = window.setTimeout(() => {
      try {
        fit.fit();
        ptyResize(id, term.cols, term.rows).catch(() => {});
        term.focus();
      } catch {
        /* ignore */
      }
    }, 30);
    return () => window.clearTimeout(t);
  }, [active, id]);

  useEffect(() => {
    if (termRef.current) termRef.current.options.theme = termColors(themeId);
  }, [themeId]);

  return <div className="terminal-host" ref={hostRef} style={{ display: active ? "block" : "none" }} />;
}
