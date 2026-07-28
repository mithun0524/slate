import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Accessibility",
  description: "WCAG 2.2 AA conformance statement for the Slate website and application, including known gaps.",
};

export default function Page() {
  return (
    <>
      <section className="wrap phead">
        <div className="crumb tag">
          <Link className="link" href="/">Slate</Link><span>/</span><span >Accessibility</span>
        </div>
        <h1 className="h1">Accessibility</h1>
        <Reveal delay={0.15}><p className="lead">WCAG 2.2 AA conformance statement for the Slate website and application, including known gaps.</p></Reveal>
      </section>

      <section className="wrap legal">
        <div className="legal-meta tag"><span>Statement updated 14 July 2026</span><span>Standard: WCAG 2.2 AA</span><span>Self-assessed</span></div>
        <Reveal className="prose">
<h2 id="site">This website</h2>
      <ul>
        <li>Semantic landmarks, one <code>h1</code> per page, headings in order.</li>
        <li>A skip link, visible focus indicators on every interactive element, and full keyboard operation — including the menu, the accordions and the horizontal views rail.</li>
        <li>Body text meets 4.5:1 contrast; large display type and UI borders meet 3:1. The vermillion accent is never the only carrier of meaning.</li>
        <li><code>prefers-reduced-motion</code> is honoured: scroll animation, the ticker, page transitions and the terminal cursor all stop.</li>
        <li>Content reflows to 320 px and remains usable at 200% zoom without horizontal scrolling.</li>
        <li>The animated product demo is decorative and duplicated in text beside it.</li>
      </ul>

      <h2 id="app">The application</h2>
      <ul>
        <li>Every view is reachable by keyboard; every shortcut is listed in <Link className="link" href="/docs/shortcuts/">the keymap</Link>.</li>
        <li>Focus order follows the visual layout, and focus is never trapped outside a modal.</li>
        <li>Four themes ship, including a high-contrast light theme; font size is configurable.</li>
        <li>Terminal output relies on your terminal&apos;s own accessibility behaviour and your screen reader&apos;s terminal support.</li>
      </ul>

      <h2 id="gaps">Known gaps</h2>
      <ul>
        <li>The timeline view is difficult to interpret without sight of the graph; a tabular equivalent is planned.</li>
        <li>Screen-reader announcements for automatic pane switches are not yet implemented — a switch is currently silent.</li>
        <li>Fonts load from a third party; if they fail, fallbacks are used but metrics shift slightly.</li>
      </ul>

      <h2 id="feedback">Feedback</h2>
      <p>If something blocks you, tell us and it gets priority: <a className="link" href="mailto:a11y@slate.tools">a11y@slate.tools</a>. Please include the page or view, your assistive technology and what you expected. We aim to reply within five working days.</p>
        </Reveal>
      </section>
    </>
  );
}
