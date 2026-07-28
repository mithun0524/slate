import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Slate makes no network requests and the site sets no cookies. What that means in detail, plus your GDPR and CCPA rights.",
};

export default function Page() {
  return (
    <>
      <section className="wrap phead">
        <div className="crumb tag">
          <Link className="link" href="/">Slate</Link><span>/</span><span >Privacy</span>
        </div>
        <h1 className="h1">Privacy</h1>
        <Reveal delay={0.15}><p className="lead">Slate makes no network requests and the site sets no cookies. What that means in detail, plus your GDPR and CCPA rights.</p></Reveal>
      </section>

      <section className="wrap legal">
        <div className="legal-meta tag"><span>Effective 14 July 2026</span><span>Version 1.0</span><span>Applies to the Slate app and slate.tools</span></div>
        <Reveal className="prose">
<h2 id="app">The application</h2>
      <p>Slate is a native desktop application. It makes <strong>no outbound network requests</strong> — no telemetry, no crash reporting, no update check, no feature flags, no analytics. There is no account system and no licence server.</p>
      <p>Everything Slate reads stays on your machine:</p>
      <ul>
        <li>File contents and diffs are read from disk and rendered locally.</li>
        <li>Terminal output lives in memory and your shell&apos;s own history file.</li>
        <li>Settings are a local TOML file at <code>~/.config/slate/config.toml</code>.</li>
        <li>Logs are local files at <code>~/.local/state/slate/</code>. They are never transmitted.</li>
      </ul>
      <p>The one listener Slate can open is the <Link className="link" href="/docs/api/">override API</Link>, bound to <code>127.0.0.1</code> and disabled by default. It accepts connections only from your own machine.</p>

      <h2 id="agents">Your agent is not Slate</h2>
      <p>Coding agents you run inside Slate&apos;s terminal — Claude Code, Codex, aider and so on — are separate programs with their own network behaviour and their own privacy terms. Slate does not intercept, log or forward what they send. Read their policies; they apply, not this one.</p>

      <h2 id="site">This website</h2>
      <p>slate.tools is static hosting. There are <strong>no cookies, no local storage, no analytics, no tag manager, no session recording and no third-party trackers</strong>. Because we set no cookies and process no personal data for our own purposes, there is no consent banner — one would be theatre.</p>
      <p>Two things do involve a third party:</p>
      <ul>
        <li><strong>Fonts and scripts</strong> are served from Google Fonts and jsDelivr. Your browser&apos;s request to them reveals your IP address and user-agent to those providers under their own terms. Self-hosting these is on the list.</li>
        <li><strong>Server logs.</strong> Our host keeps standard access logs (IP, timestamp, path, user-agent) for security and abuse handling, retained 30 days, never used for profiling.</li>
      </ul>

      <h2 id="rights">Your rights</h2>
      <p>Under the GDPR, UK GDPR and CCPA/CPRA you have rights of access, correction, deletion, portability and objection. We hold essentially nothing to act on: no account, no email list, no profile. If you believe we hold data about you, write to <a className="link" href="mailto:privacy@slate.tools">privacy@slate.tools</a> and we will answer within 30 days. We do not sell or share personal information, and we never have.</p>
      <p>Legal basis for the server logs is legitimate interest in keeping the site available and secure.</p>

      <h2 id="children">Children</h2>
      <p>Slate is a developer tool and is not directed at children under 13. We knowingly collect nothing from anyone, including them.</p>

      <h2 id="changes">Changes</h2>
      <p>If this policy changes materially, the new version appears here with a new effective date and is noted in the <Link className="link" href="/changelog/">changelog</Link>. There is no mailing list to notify, by design.</p>

      <h2 id="contact">Contact</h2>
      <p><a className="link" href="mailto:privacy@slate.tools">privacy@slate.tools</a> · security reports: <Link className="link" href="/.well-known/security.txt">security.txt</Link></p>
        </Reveal>
      </section>
    </>
  );
}
