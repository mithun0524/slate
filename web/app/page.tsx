import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import HeroVideo from "@/components/HeroVideo";
import ViewTabs from "@/components/ViewTabs";
import CopyLine from "@/components/CopyLine";
import Faq from "@/components/Faq";
import Code from "@/components/Code";

const SPEC: [string, string][] = [
  ["Engine", "Rust · Tauri 2 · system WebView"],
  ["Install size", "12.4 MB"],
  ["Idle CPU", "< 0.3% · native fs notifications"],
  ["Terminal", "Full PTY — your shell, dotfiles, prompt"],
  ["Classifier", "Deterministic · no inference · unit-tested"],
  ["Replay depth", "20 bursts with diff snapshots"],
  ["Override API", "127.0.0.1:8477 · opt-in"],
  ["Telemetry", "None. No account, no sync, no network."],
  ["Licence", "MIT"],
];

const CLASSIFY = `// classifier.rs
if md_created || md_live.len() >= non_md {
    return ViewIntent::Spec { path }
}
if structural >= 2 && structural >= modified.len() {
    return ViewIntent::Tree
}
return ViewIntent::Diff { paths }`;

export default function Home() {
  return (
    <>
      {/* ── hero ─────────────────────────────────────────── */}
      <section className="hero wrap">
        <Reveal>
          <span className="eyebrow">
            <span className="pip" />
            v0.1.0 out now
            <span className="sep">·</span>
            <span style={{ color: "var(--dim)" }}>macOS &amp; Linux</span>
          </span>
        </Reveal>

        <Reveal delay={0.05}>
          <h1 className="h1">The terminal that shows its work</h1>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="lead">
            Your agent writes; Slate puts the right view next to it. Spec when it writes a spec,
            diff when it edits code, tree when it moves files. No tabbing, no guessing.
          </p>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="hero-act">
            <Link className="btn btn-lg btn-primary" href="/download">
              Download for macOS
              <svg className="ic" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M8 2.5v9M4.5 8l3.5 3.5L11.5 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Link className="btn btn-lg" href="/docs">Read the docs</Link>
          </div>
          <p className="hero-note">
            Free and MIT licensed · <code>brew install --cask slate</code>
          </p>
        </Reveal>

        <HeroVideo />

        <div className="logos">
          <span>Works with</span>
          {["Claude Code", "Codex", "Gemini CLI", "aider", "any TTY"].map((n, i) => (
            <span key={n} style={{ display: "contents" }}>
              {i > 0 && <span className="sep">·</span>}
              <span style={{ color: "var(--fg-2)" }}>{n}</span>
            </span>
          ))}
        </div>
      </section>

      {/* ── problem ──────────────────────────────────────── */}
      <section className="pad-y wrap">
        <div className="sec-head">
          <span className="tag">The problem</span>
          <h2 className="h2">You start the agent, and then you go blind</h2>
          <p className="lead">
            Three things go wrong in every session. None of them are the model&apos;s fault.
          </p>
        </div>

        <div className="bento">
          {[
            {
              c: "c2",
              h: "Writes you never see",
              p: "Two hundred lines scroll past and somewhere in there it touched auth. You find out at review — or in prod.",
              art: (
                <div className="mock d">
                  ● Write src/auth/session.ts<br />
                  ● Write src/auth/tokens.ts<br />
                  ● Edit src/middleware.ts<br />
                  <span style={{ color: "var(--dim-2)" }}>…scrolled out of the buffer</span>
                </div>
              ),
            },
            {
              c: "c2",
              h: "Four windows, one thought",
              p: "Terminal, editor, git diff, the spec from an hour ago. The tab is cheap; the thread you lose is not.",
              art: (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {["terminal", "editor", "git diff", "spec.md"].map((t) => (
                    <span className="chip" key={t}>{t}</span>
                  ))}
                </div>
              ),
            },
            {
              c: "c2",
              h: "“It worked ten minutes ago”",
              p: "The change that broke it is gone from the buffer. Your only tool is git stash and hope.",
              art: (
                <div className="bars">
                  {[30, 62, 90, 44, 78, 36, 58, 88, 40].map((h, i) => (
                    <i key={i} className={i === 5 ? "hi" : ""} style={{ height: `${h}%` }} />
                  ))}
                </div>
              ),
            },
          ].map((card, i) => (
            <Reveal key={card.h} className={`card ${card.c} c-wide`} delay={i * 0.05}>
              <h3 className="h3">{card.h}</h3>
              <p className="body">{card.p}</p>
              <div className="art">{card.art}</div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── mechanism ────────────────────────────────────── */}
      <section className="pad-y wrap" id="how">
        <div className="sec-head">
          <span className="tag">How it works</span>
          <h2 className="h2">A watcher, a classifier, a pane</h2>
          <p className="lead">
            No prompts, no model, no configuration. About sixty lines of Rust decide what you see.
          </p>
        </div>

        <div className="steps">
          {[
            ["1", "Writes become a burst", "Filesystem events are debounced into one unit — the agent just did a thing — instead of forty stray events."],
            ["2", "The burst is classified", "Markdown → spec. Creates and deletes → tree. Content edits → diff of exactly those files."],
            ["3", "Pane B switches itself", "Open before you look up. Click to take over; ⌘. pins the view for good."],
          ].map(([n, h, p], i) => (
            <Reveal key={n} className="step" delay={i * 0.05}>
              <span className="n">{n}</span>
              <h3 className="h3">{h}</h3>
              <p>{p}</p>
            </Reveal>
          ))}
        </div>

        <Reveal delay={0.1}>
          <div style={{ marginTop: 14 }}>
            <Code className="pre" code={CLASSIFY} />
          </div>
          <p className="body" style={{ marginTop: 12, maxWidth: "62ch" }}>
            Deterministic and unit-tested, so it is right before you finish looking up — and when it
            is wrong, one click corrects it. Your agent can also{" "}
            <Link className="link" href="/docs/api">drive the pane itself</Link> through a loopback
            endpoint.
          </p>
        </Reveal>
      </section>

      {/* ── views ────────────────────────────────────────── */}
      <section className="pad-y wrap" id="views">
        <div className="sec-head">
          <span className="tag">Surfaces</span>
          <h2 className="h2">Everything you were tabbing away to</h2>
          <p className="lead">Six views, one shortcut each. The classifier only picks between the first three.</p>
        </div>
        <ViewTabs />
      </section>

      {/* ── spec + faq ───────────────────────────────────── */}
      <section className="pad-y wrap" id="spec">
        <div className="sec-head">
          <span className="tag">Specification</span>
          <h2 className="h2">What you are installing</h2>
          <p className="lead">
            A 12 MB native binary that reads your filesystem and nothing else.
          </p>
        </div>

        <div className="two">
          <Reveal className="card pad-card">
            <table className="spec">
              <caption className="vh">Slate technical specification</caption>
              <tbody>
                {SPEC.map(([k, v]) => (
                  <tr key={k}><th scope="row">{k}</th><td>{v}</td></tr>
                ))}
              </tbody>
            </table>

            <div className="card-foot">
              <div>
                <span className="tag">Runs on</span>
                <p className="body">macOS 12+ (Apple silicon or Intel) · Linux glibc 2.31+</p>
              </div>
              <Link className="link" href="/download">
                All builds &amp; checksums
                <svg className="ic" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </Reveal>

          <Reveal className="col-stack" delay={0.06}>
            <div className="card pad-card">
              <h3 className="h3" style={{ marginBottom: 4 }}>Before you download</h3>
              <Faq />
            </div>

            <div className="card pad-card privacy-card">
              <div className="pc-head">
                <span className="pc-dot" />
                <h3 className="h3">Nothing leaves your machine</h3>
              </div>
              <p className="body">
                No account, no sync, no crash reporting, no update check. The only socket Slate can
                open is a loopback listener you turn on yourself.
              </p>
              <div className="pc-rows">
                {[
                  ["Outbound requests", "0"],
                  ["Cookies set by this site", "0"],
                  ["Data we could hand over", "None — we hold none"],
                ].map(([k, v]) => (
                  <div key={k}><span>{k}</span><b>{v}</b></div>
                ))}
              </div>
              <Link className="link" href="/privacy">
                Read the privacy page
                <svg className="ic" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── cta ──────────────────────────────────────────── */}
      <section className="cta wrap">
        <h2 className="h2">Stop asking your agent what it just did</h2>
        <p className="lead">
          One download, no account. Slate opens on the folder you are in and starts watching.
        </p>
        <div className="cta-act">
          <Link className="btn btn-lg btn-primary" href="/download">Download 0.1.0</Link>
          <Link className="btn btn-lg" href="/docs">Documentation</Link>
        </div>
        <div style={{ marginTop: 22, maxWidth: 420, marginInline: "auto" }}>
          <CopyLine value="brew install --cask slate" />
        </div>
      </section>
    </>
  );
}
