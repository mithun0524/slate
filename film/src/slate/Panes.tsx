import React from "react";
import { at, c, mono, sans } from "./theme";

/** Views never cross-fade — they wipe, so no glyph is ever half-transparent. */
export const Wipe: React.FC<{ local: number; children: React.ReactNode }> = ({
  local,
  children,
}) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      clipPath: `inset(0 ${at(local, [0, 20], [100, 0])}% 0 0)`,
      translate: `${at(local, [0, 24], [14, 0])}px 0px`,
    }}
  >
    {children}
  </div>
);

export const PaneHeader: React.FC<{ view: string; path: string; local: number }> = ({
  view,
  path,
  local,
}) => (
  <div
    style={{
      height: 46,
      borderBottom: `1px solid ${c.lineSoft}`,
      display: "flex",
      alignItems: "center",
      gap: 14,
      padding: "0 20px",
      fontFamily: mono,
      fontSize: 17,
      background: c.bg2,
      opacity: at(local, [0, 16], [0, 1]),
    }}
  >
    <span style={{ color: c.fg2, letterSpacing: "0.14em", textTransform: "uppercase" }}>
      {view}
    </span>
    <span style={{ color: c.dim3 }}>{path}</span>
    <span
      style={{
        marginLeft: "auto",
        display: "flex",
        alignItems: "center",
        gap: 8,
        color: c.dim2,
        fontSize: 15,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 6, background: c.add }} />
      auto
    </span>
  </div>
);

const Body: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ padding: "26px 30px", display: "flex", flexDirection: "column", gap: 14 }}>
    {children}
  </div>
);

/* ── spec ─────────────────────────────────────────────────────── */

const CHECKS: [string, boolean][] = [
  ["Token bucket per API key", true],
  ["429 + Retry-After header", true],
  ["Shared counter across replicas", false],
  ["Burst allowance for trusted keys", false],
];

export const SpecView: React.FC<{ local: number; tick: number }> = ({ local, tick }) => (
  <Wipe local={local}>
    <PaneHeader view="spec" path="docs/specs/rate-limiting.md" local={local} />
    <Body>
      <div
        style={{
          fontFamily: sans,
          fontSize: 40,
          fontWeight: 500,
          letterSpacing: "-0.02em",
          color: c.fg,
          clipPath: `inset(0 ${at(local, [14, 34], [100, 0])}% 0 0)`,
        }}
      >
        Rate limiting
      </div>
      <div
        style={{
          fontFamily: sans,
          fontSize: 21,
          lineHeight: 1.6,
          color: c.dim,
          maxWidth: 620,
          clipPath: `inset(0 ${at(local, [20, 46], [100, 0])}% 0 0)`,
        }}
      >
        Token bucket, per key, evaluated in the edge middleware before the router sees
        the request.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 13, marginTop: 8 }}>
        {CHECKS.map(([label, pre], i) => {
          const on = pre || local >= tick;
          const pop = pre ? 1 : at(local, [tick, tick + 12], [0, 1]);
          return (
            <div
              key={label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                fontFamily: sans,
                fontSize: 22,
                color: on ? c.fg2 : c.dim2,
                opacity: at(local, [28 + i * 5, 44 + i * 5], [0, 1]),
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  border: `1.5px solid ${on ? c.add : c.dim3}`,
                  background: on ? c.addBg : "transparent",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width={14} height={14} viewBox="0 0 14 14" fill="none">
                  <path
                    d="M2.5 7.5 5.5 10.5 11.5 3.5"
                    stroke={c.add}
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={14}
                    strokeDashoffset={14 - 14 * (on ? pop : 0)}
                  />
                </svg>
              </span>
              {label}
            </div>
          );
        })}
      </div>
    </Body>
  </Wipe>
);

/* ── diff ─────────────────────────────────────────────────────── */

type Row = { k: "ctx" | "add" | "del"; n: string; text: string; hot?: string };

const ROWS: Row[] = [
  { k: "ctx", n: "14", text: "export const limit = (req: Request) => {" },
  { k: "del", n: "15", text: "  return next(req)", hot: "next(req)" },
  { k: "add", n: "15", text: "  const key = apiKey(req)", hot: "apiKey(req)" },
  { k: "add", n: "16", text: "  const bucket = buckets.take(key, 1)" },
  { k: "add", n: "17", text: "  if (!bucket.ok) {" },
  { k: "add", n: "18", text: "    return tooMany(bucket.retryAfter)" },
  { k: "add", n: "19", text: "  }" },
  { k: "ctx", n: "20", text: "  return next(req)" },
  { k: "ctx", n: "21", text: "}" },
];

export const DiffView: React.FC<{ local: number; bloom: number }> = ({ local, bloom }) => (
  <Wipe local={local}>
    <PaneHeader view="diff" path="src/server/middleware/limit.ts" local={local} />
    <div style={{ padding: "18px 0 0" }}>
      <div
        style={{
          fontFamily: mono,
          fontSize: 17,
          color: c.hunk,
          background: "rgba(108,176,255,.08)",
          padding: "7px 30px",
          opacity: at(local, [12, 26], [0, 1]),
        }}
      >
        @@ -14,4 +14,9 @@ export const limit
      </div>
      {ROWS.map((r, i) => {
        const enter = 20 + i * 4;
        const bg = r.k === "add" ? c.addBg : r.k === "del" ? c.delBg : "transparent";
        const fg = r.k === "add" ? c.addFg : r.k === "del" ? c.delFg : c.dim;
        const parts = r.hot ? r.text.split(r.hot) : [r.text];
        return (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              fontFamily: mono,
              fontSize: 20,
              lineHeight: 2,
              background: bg,
              color: fg,
              whiteSpace: "pre",
              clipPath: `inset(0 ${at(local, [enter, enter + 14], [100, 0])}% 0 0)`,
            }}
          >
            <span
              style={{
                width: 74,
                paddingRight: 16,
                textAlign: "right",
                color: r.k === "add" ? c.add : r.k === "del" ? c.del : c.dim3,
                background:
                  r.k === "add"
                    ? "rgba(70,149,74,.3)"
                    : r.k === "del"
                      ? "rgba(203,66,62,.32)"
                      : "transparent",
              }}
            >
              {r.n}
            </span>
            <span style={{ width: 26, paddingLeft: 14, color: fg }}>
              {r.k === "add" ? "+" : r.k === "del" ? "−" : " "}
            </span>
            <span>
              {parts[0]}
              {r.hot ? (
                /* the token is never invisible — only the highlight arrives, wiping
                   across it. Fading the span itself left the line reading "return"
                   with its tail missing until the bloom landed. */
                <span
                  style={{
                    color: "#fff",
                    padding: "1px 2px",
                    display: "inline-block",
                    background: `linear-gradient(90deg, ${
                      r.k === "add" ? c.wlAdd : c.wlDel
                    } ${at(local, [bloom, bloom + 16], [0, 100])}%, transparent ${at(
                      local,
                      [bloom, bloom + 16],
                      [0, 100],
                    )}%)`,
                  }}
                >
                  {r.hot}
                </span>
              ) : null}
              {parts[1] ?? ""}
            </span>
          </div>
        );
      })}
    </div>
  </Wipe>
);

/* ── tree ─────────────────────────────────────────────────────── */

type Node = { d: number; name: string; badge?: "A" | "M" | "R" };

const TREE: Node[] = [
  { d: 0, name: "src/" },
  { d: 1, name: "server/" },
  { d: 2, name: "limiter/", badge: "A" },
  { d: 3, name: "bucket.ts", badge: "R" },
  { d: 3, name: "window.ts", badge: "R" },
  { d: 3, name: "index.ts", badge: "A" },
  { d: 2, name: "middleware/" },
  { d: 3, name: "limit.ts", badge: "M" },
  { d: 1, name: "lib/" },
  { d: 2, name: "clock.ts", badge: "M" },
];

const BADGE = { A: c.add, M: c.hunk, R: "#e2b23c" } as const;

export const TreeView: React.FC<{ local: number }> = ({ local }) => (
  <Wipe local={local}>
    <PaneHeader view="tree" path="6 moved · 2 added · 2 modified" local={local} />
    <Body>
      {TREE.map((n, i) => {
        const enter = 14 + i * 5;
        return (
          <div
            key={n.name + i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginLeft: n.d * 34,
              fontFamily: mono,
              fontSize: 21,
              color: n.name.endsWith("/") ? c.fg2 : c.dim,
              opacity: at(local, [enter, enter + 14], [0, 1]),
              translate: `${at(local, [enter, enter + 16], [-14, 0])}px 0px`,
            }}
          >
            {n.badge ? (
              <span
                style={{
                  width: 22,
                  height: 22,
                  border: `1px solid ${BADGE[n.badge]}`,
                  color: BADGE[n.badge],
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {n.badge}
              </span>
            ) : (
              <span style={{ width: 22 }} />
            )}
            {n.name}
          </div>
        );
      })}
    </Body>
  </Wipe>
);
