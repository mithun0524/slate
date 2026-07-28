"use client";

import { useEffect, useRef, useState } from "react";

/* The product in fifteen seconds: the agent types, files land, pane B
   switches itself. Runs only while on screen. */

type Step =
  | { type: string; cls: string; after: number }
  | { line: string; after?: number }
  | { view: View; mid: string; after: number };

type View = "spec" | "diff" | "tree";

const SCRIPT: Step[] = [
  { type: "$ claude", cls: "p", after: 420 },
  { line: "" },
  { type: "› implement the retry policy in docs/retry.md", cls: "d", after: 560 },
  { line: "" },
  { line: `<span class="b">●</span> Read <span class="d">docs/retry.md</span>`, after: 420 },
  { view: "spec", mid: "spec · docs/retry.md", after: 1700 },
  { line: `<span class="b">●</span> Write <span class="g">src/checkout/retry.ts</span>`, after: 260 },
  { line: `<span class="b">●</span> Write <span class="g">src/checkout/backoff.ts</span>`, after: 260 },
  { line: `<span class="b">●</span> Delete <span class="d">src/checkout/legacy.ts</span>`, after: 320 },
  { view: "tree", mid: "burst · 3 structural", after: 1700 },
  { line: `<span class="b">●</span> Edit <span class="g">src/checkout/index.ts</span>`, after: 280 },
  { line: `<span class="b">●</span> Edit <span class="g">tests/checkout.spec.ts</span>`, after: 320 },
  { view: "diff", mid: "burst · 2 modified", after: 2100 },
  { line: "" },
  { line: `<span class="g">✓</span> 4 tests passed · +128 −41`, after: 2900 },
];

export default function ProductWindow() {
  const box = useRef<HTMLDivElement>(null);
  const term = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>("spec");
  const [mid, setMid] = useState("watching 1,204 files");

  useEffect(() => {
    const el = box.current;
    const out = term.current;
    if (!el || !out) return;

    let i = 0;
    let lines: string[] = [];
    let timer: number;
    let alive = true;

    const paint = () => {
      if (lines.length > 13) lines = lines.slice(-13);
      out.innerHTML = lines.join("<br>") + `<span class="caret"></span>`;
    };

    const step = () => {
      if (!alive) return;
      if (i >= SCRIPT.length) {
        timer = window.setTimeout(() => {
          lines = []; i = 0; setView("spec"); step();
        }, 1000);
        return;
      }
      const s = SCRIPT[i++];
      if ("view" in s) {
        setView(s.view);
        setMid(s.mid);
        timer = window.setTimeout(step, s.after);
        return;
      }
      if ("line" in s) {
        lines.push(s.line);
        paint();
        timer = window.setTimeout(step, s.after ?? 300);
        return;
      }
      let n = 0;
      lines.push("");
      const type = () => {
        if (!alive) return;
        lines[lines.length - 1] = `<span class="${s.cls}">${s.type.slice(0, ++n)}</span>`;
        paint();
        timer = window.setTimeout(n < s.type.length ? type : step, n < s.type.length ? 34 : s.after);
      };
      type();
    };

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) { io.disconnect(); step(); }
      },
      { threshold: 0.15 }
    );
    io.observe(el);

    return () => { alive = false; clearTimeout(timer); io.disconnect(); };
  }, []);

  return (
    <div className="win" ref={box}>
      <div className="win-bar">
        <i /><i /><i />
        <span className="t">slate — ~/checkout-service</span>
      </div>
      <div className="win-body">
        <div className="term" ref={term} aria-hidden="true" />
        <div className="sep" />
        <div className="pane">
          <div className="pane-hd">
            {(["spec", "diff", "tree"] as View[]).map((v) => (
              <b key={v} className={view === v ? "on" : ""}>{v}</b>
            ))}
            <span className="src">classifier</span>
          </div>
          <div className="pane-stage">
            <div className={`pane-v ${view === "spec" ? "on" : ""}`}>
              <div className="sk-h" /><div className="sk-p" /><div className="sk-p s" />
              <div className="sk-s" /><div className="sk-l" />
              <div className="sk-l" style={{ width: "54%" }} /><div className="sk-l" />
              <div className="sk-c" />
            </div>
            <div className={`pane-v ${view === "diff" ? "on" : ""}`}>
              <pre className="dif"><code>
                <span className="f">src/checkout/retry.ts</span>
                <span className="r">- return await charge(order)</span>
                <span className="a">+ return await withRetry(() =&gt; charge(order), {"{"}</span>
                <span className="a">+   attempts: 3,</span>
                <span className="a">+   backoff: &quot;exponential&quot;,</span>
                <span className="a">+ {"}"})</span>
              </code></pre>
            </div>
            <div className={`pane-v ${view === "tree" ? "on" : ""}`}>
              <ul className="tre">
                <li><s className="a">A</s>src/checkout/retry.ts</li>
                <li><s className="a">A</s>src/checkout/backoff.ts</li>
                <li><s className="m">M</s>src/checkout/index.ts</li>
                <li><s className="m">M</s>tests/checkout.spec.ts</li>
                <li><s className="d">D</s>src/checkout/legacy.ts</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <div className="win-foot">
        <span>⎇ feat/retry-policy</span>
        <span className="mid">{mid}</span>
        <span className="live"><i />agent running</span>
      </div>
    </div>
  );
}
