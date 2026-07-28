import Link from "next/link";
import { Mark } from "./Header";
import CopyLine from "./CopyLine";
import FooterArt from "./FooterArt";

const COLS = [
  {
    h: "Product",
    links: [
      ["Download", "/download"],
      ["The six views", "/#views"],
      ["Specification", "/#spec"],
      ["Changelog", "/changelog"],
    ],
  },
  {
    h: "Documentation",
    links: [
      ["Getting started", "/docs"],
      ["Concepts", "/docs/concepts"],
      ["Shortcuts", "/docs/shortcuts"],
      ["Override API", "/docs/api"],
      ["Troubleshooting", "/docs/troubleshooting"],
    ],
  },
  {
    h: "Source",
    links: [
      ["GitHub", "https://github.com/"],
      ["Releases", "https://github.com/"],
      ["Report a bug", "https://github.com/"],
      ["security.txt", "/.well-known/security.txt"],
    ],
  },
  {
    h: "Legal",
    links: [
      ["Privacy", "/privacy"],
      ["Terms", "/terms"],
      ["Accessibility", "/accessibility"],
    ],
  },
];

export default function Footer() {
  return (
    <footer className="foot">
      <div className="wrap">
        {/* the card rides over the top edge of the slab */}
        <div className="foot-card">
          <div className="fc-copy">
            <h2 className="h2">The pane that<br />switches itself</h2>
            <p className="body">12.4 MB · macOS &amp; Linux · free and MIT licensed</p>
            <div className="fc-act">
              <Link className="btn btn-lg btn-primary" href="/download">Download Slate</Link>
              <Link className="btn btn-lg" href="/docs">Read the docs</Link>
            </div>
            <CopyLine value="brew install --cask slate" />
          </div>

          <div className="fc-art" aria-hidden="true">
            <FooterArt />
          </div>
        </div>

      </div>

      <div className="foot-slab">
        <div className="wrap">
          <div className="foot-top">
            <div className="foot-brand">
              <Link className="brand" href="/"><Mark /><span>Slate</span></Link>
              <p className="body">
                A terminal that shows its work.<br />Built in a terminal, for terminals.
              </p>
              <div className="foot-status">
                <span className="fs-dot" />
                v0.1.0 — shipped 14 July 2026
              </div>
              <dl className="foot-contact">
                <div>
                  <dt>Bugs &amp; features</dt>
                  <dd><a className="link" href="https://github.com/" target="_blank" rel="noopener noreferrer">github.com/slate</a></dd>
                </div>
                <div>
                  <dt>Security</dt>
                  <dd><a className="link" href="mailto:security@slate.tools">security@slate.tools</a></dd>
                </div>
              </dl>
            </div>

            <div className="foot-cols">
              {COLS.map((c) => (
                <div key={c.h}>
                  <h4>{c.h}</h4>
                  <ul>
                    {c.links.map(([label, href]) => (
                      <li key={label}>
                        {href.startsWith("http") ? (
                          <a href={href} target="_blank" rel="noopener noreferrer">{label}</a>
                        ) : (
                          <Link href={href}>{label}</Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="foot-bot">
            <span>© 2026 Slate · MIT licence</span>
            <span className="sp">No cookies. No trackers. No telemetry.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
