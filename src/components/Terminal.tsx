import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebglAddon } from "@xterm/addon-webgl";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { SearchAddon } from "@xterm/addon-search";
import "@xterm/xterm/css/xterm.css";
import {
  onPtyData,
  onPtyExit,
  openExternal,
  ptyClose,
  ptyResize,
  ptySpawn,
  ptyWrite,
} from "../lib/ipc";
import { THEMES, type ThemeId } from "../lib/themes";

/// What TerminalPane can drive on a mounted terminal (the find bar).
export interface TermHandle {
  find: (q: string, back?: boolean) => boolean;
  clearFind: () => void;
  focus: () => void;
}

// ANSI palette (VS Code Dark Modern), with brightBlack lifted from #666 —
// agents render most secondary text in it and #666 on #1e1e1e is ~2.2:1.
const ANSI = {
  black: "#272727",
  red: "#cd3131",
  green: "#0dbc79",
  yellow: "#e5e510",
  blue: "#3b8eea",
  magenta: "#bc3fbc",
  cyan: "#11a8cd",
  white: "#e5e5e5",
  brightBlack: "#8f8f8f",
  brightRed: "#f14c4c",
  brightGreen: "#23d18b",
  brightYellow: "#f5f543",
  brightBlue: "#6cb6ff",
  brightMagenta: "#d670d6",
  brightCyan: "#29b8db",
  brightWhite: "#ffffff",
};

function termColors(id: ThemeId) {
  const t = THEMES.find((x) => x.id === id) ?? THEMES[0];
  return {
    ...ANSI,
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
  handleRef,
}: {
  id: string;
  themeId: ThemeId;
  active: boolean;
  handleRef?: Ref<TermHandle>;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<XTerm | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const searchRef = useRef<SearchAddon | null>(null);

  useImperativeHandle(handleRef, () => ({
    find: (q, back) => {
      const s = searchRef.current;
      if (!s || !q) return false;
      const opts = {
        decorations: {
          matchBackground: "#5f4b1e",
          activeMatchBackground: "#a37b12",
          matchOverviewRuler: "#f5f543",
          activeMatchColorOverviewRuler: "#f5f543",
        },
      };
      return back ? s.findPrevious(q, opts) : s.findNext(q, opts);
    },
    clearFind: () => searchRef.current?.clearDecorations(),
    focus: () => termRef.current?.focus(),
  }));

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const term = new XTerm({
      fontFamily: '"SF Mono", ui-monospace, Menlo, Consolas, monospace',
      fontSize: 13,
      cursorBlink: true,
      // Agents paint secondary text in 256-colour grays; xterm lifts anything
      // below this against the current background (also saves the light theme).
      minimumContrastRatio: 4.5,
      theme: termColors(themeId),
    });
    termRef.current = term;
    const fit = new FitAddon();
    fitRef.current = fit;
    term.loadAddon(fit);

    const search = new SearchAddon();
    searchRef.current = search;
    term.loadAddon(search);

    // Links must not go through window.open — in a WKWebView that navigates
    // the app itself away. Hand the URL to the OS instead.
    term.loadAddon(
      new WebLinksAddon((ev, uri) => {
        ev.preventDefault();
        openExternal(uri).catch(() => {});
      }),
    );

    term.open(host);

    // GPU renderer. Without it the DOM renderer is the bottleneck under a
    // firehose (build output, agent streaming) — exactly what the pty-side
    // output coalescing feeds it. Falls back silently if context creation
    // fails or is lost (happens on GPU driver resets / heavy tab counts).
    try {
      const webgl = new WebglAddon();
      webgl.onContextLoss(() => webgl.dispose());
      term.loadAddon(webgl);
    } catch {
      /* DOM renderer is a fine fallback */
    }

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
