import type { Metadata } from "next";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import DownloadCard from "@/components/DownloadCard";
import CopyLine from "@/components/CopyLine";

export const metadata: Metadata = {
  title: "Download",
  description:
    "Download Slate 0.1.0 for Apple silicon, Intel Mac or Linux. 12.4 MB, no account, no telemetry. Homebrew cask and checksums included.",
};

const BUILDS: [string, string, string][] = [
  ["Slate-0.1.0-arm64.dmg", "macOS · Apple silicon · 12.4 MB", "/releases/Slate-0.1.0-arm64.dmg"],
  ["Slate-0.1.0-x64.dmg", "macOS · Intel · 13.1 MB", "/releases/Slate-0.1.0-x64.dmg"],
  ["Slate-0.1.0-x86_64.AppImage", "Linux · glibc 2.31+ · 14.8 MB", "/releases/Slate-0.1.0-x86_64.AppImage"],
  ["slate_0.1.0_amd64.deb", "Debian · Ubuntu · 13.9 MB", "/releases/slate_0.1.0_amd64.deb"],
];

const REQS: [string, string][] = [
  ["macOS", "12 Monterey or newer · Apple silicon or Intel"],
  ["Linux", "glibc 2.31+ · WebKitGTK 4.1 · X11 or Wayland"],
  ["Windows", "Not yet — tracked on the roadmap"],
  ["Disk", "~40 MB installed"],
  ["Memory", "~90 MB resident with one terminal open"],
  ["Git", "2.30+ on PATH for the git surfaces"],
];

export default function Page() {
  return (
    <>
      <section className="wrap phead">
        <div className="crumb tag">
          <Link className="link" href="/">Slate</Link>
          <span>/</span>
          <span >Download</span>
        </div>
        <h1 className="h1">Twelve megabytes. No account.</h1>
        <Reveal delay={0.15}>
          <p className="lead">
            Slate opens on the folder you&apos;re in and starts watching immediately. Nothing to
            configure, nothing to sign up for.
          </p>
        </Reveal>
      </section>

      <section className="wrap dl-grid">
        <Reveal><DownloadCard /></Reveal>
        <Reveal delay={0.1}>
          <div className="sec-head"><span className="tag">Package managers</span><h2 className="h2" style={{fontSize:24}}>One line</h2></div>
          <CopyLine value="brew install --cask slate" />
          <CopyLine value="curl -fsSL https://slate.tools/install.sh | sh" />
          <p className="body" style={{ marginTop: 18, maxWidth: "48ch", fontSize: 14.5 }}>
            The script picks the build for your architecture, verifies its SHA-256 against the
            published manifest, and installs to /Applications or ~/.local/bin.
          </p>
        </Reveal>
      </section>

      <section className="pad-y">
        <div className="wrap">
          <div className="sec-head"><span className="tag">First run</span><h2 className="h2" style={{fontSize:24}}>Under a minute</h2></div>
          <div className="steps">
            {[
              ["01", "Open a folder", "Point Slate at a repository. It reads your git state and starts the watcher — no indexing wait."],
              ["02", "Run your agent", "The left pane is a real PTY. Start claude, codex, aider — whatever you already use."],
              ["03", "Look up", "Pane B is already showing the spec, diff or tree. Press ⌘. to pin one in place."],
            ].map(([n, h, p], i) => (
              <Reveal key={n} delay={i * 0.07}>
                <span className="tag">{n}</span>
                <h3 className="h3">{h}</h3>
                <p className="body">{p}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="pad-y" id="builds">
        <div className="wrap">
          <div className="sec-head"><span className="tag">All builds</span><h2 className="h2" style={{fontSize:24}}>v0.1.0 · 2026-07-14</h2></div>
          <ul className="pkg">
            {BUILDS.map(([name, meta, href]) => (
              <Reveal as="li" key={name}>
                <span>
                  <span className="nm">{name}</span>
                  <span className="sz">{meta}</span>
                </span>
                <a className="btn btn-sm" href={href} download>Get</a>
              </Reveal>
            ))}
            <Reveal as="li">
              <span>
                <span className="nm">Source</span>
                <span className="sz">Build it yourself · cargo + node</span>
              </span>
              <a className="btn btn-sm" href="https://github.com/" target="_blank" rel="noopener noreferrer">GitHub</a>
            </Reveal>
          </ul>

          <div style={{ marginTop: 70 }}>
            <div className="sec-head"><span className="tag">Verify the download</span><h2 className="h2" style={{fontSize:24}}>SHA-256</h2></div>
            <CopyLine value="shasum -a 256 Slate-0.1.0-arm64.dmg" />
            <table className="spec" style={{ marginTop: 26 }}>
              <caption className="vh">Published checksums for release 0.1.0</caption>
              <tbody>
                <tr><th scope="row">arm64.dmg</th><td className="sha">b41c9e2f7a1d8c05e3f6a94b2d7c08fe15a3d9b6c2e84f70a5d1c93b6e2f8a4d</td></tr>
                <tr><th scope="row">x64.dmg</th><td className="sha">7d2a5f8c1b93e604a7f2d85c31b9e0a6f4c78d25b1e93a07c6d4f81b2a95e3c0</td></tr>
                <tr><th scope="row">AppImage</th><td className="sha">e93b1c7a4d02f85b6c19d3e7a08f52c4b7d61a93e05f2c8b41d7a63e90c8b512</td></tr>
                <tr><th scope="row">Signing</th><td>Notarized by Apple · Developer ID application certificate</td></tr>
              </tbody>
            </table>
            <p className="tag" style={{ marginTop: 18 }}>
              Placeholder digests — swap this table and the /releases links for real artifacts when
              the first build is tagged.
            </p>
          </div>
        </div>
      </section>

      <section className="pad-y">
        <div className="wrap specs-grid">
          <div>
            <div className="sec-head"><span className="tag">Requirements</span><h2 className="h2" style={{fontSize:24}}>Modest</h2></div>
            <table className="spec">
              <caption className="vh">System requirements</caption>
              <tbody>
                {REQS.map(([k, v]) => (
                  <tr key={k}><th scope="row">{k}</th><td>{v}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <div>
            <div className="sec-head"><span className="tag">Good to know</span><h2 className="h2" style={{fontSize:24}}>02</h2></div>
            <div className="note">
              <span className="tag">Gatekeeper</span>
              <p>
                macOS builds are signed and notarized, so they open normally. If you built from
                source, right-click the app and choose Open the first time.
              </p>
            </div>
            <div className="note" style={{ marginTop: 18 }}>
              <span className="tag">Updates</span>
              <p>
                Slate never checks for updates in the background — that would be a network call.
                Watch the <Link className="link" href="/changelog">changelog</Link> instead.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
