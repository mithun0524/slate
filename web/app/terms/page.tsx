import type { Metadata } from "next";
import Link from "next/link";
import Code from "@/components/Code";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Terms of use",
  description: "MIT licence, no warranty, acceptable use of slate.tools and third-party components.",
};

export default function Page() {
  return (
    <>
      <section className="wrap phead">
        <div className="crumb tag">
          <Link className="link" href="/">Slate</Link><span>/</span><span >Terms of use</span>
        </div>
        <h1 className="h1">Terms of use</h1>
        <Reveal delay={0.15}><p className="lead">MIT licence, no warranty, acceptable use of slate.tools and third-party components.</p></Reveal>
      </section>

      <section className="wrap legal">
        <div className="legal-meta tag"><span>Effective 14 July 2026</span><span>Version 1.0</span></div>
        <Reveal className="prose">
<h2 id="licence">Licence</h2>
      <p>The Slate source code and the binaries built from it are released under the MIT licence. You may use, copy, modify, merge, publish, distribute, sublicense and sell copies, subject to including the copyright notice and this permission notice.</p>
      <Code className="pre" code={`Copyright (c) 2026 Slate

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction...`} />
      <p>The full text ships in the repository as <code>LICENSE</code>.</p>

      <h2 id="warranty">No warranty</h2>
      <p>The software is provided "as is", without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose and noninfringement. In no event shall the authors be liable for any claim, damages or other liability arising from the software or its use.</p>
      <p>Plainly: Slate reads and writes files in your repositories and runs a shell. Keep your work in version control. Nothing here removes rights you have under mandatory consumer law in your jurisdiction.</p>

      <h2 id="acceptable">Acceptable use of this site</h2>
      <ul>
        <li>Do not attempt to disrupt, overload or gain unauthorised access to the site or its hosting.</li>
        <li>Do not redistribute modified binaries as if they were official Slate releases.</li>
        <li>Automated scraping at a volume that degrades service is not permitted.</li>
      </ul>

      <h2 id="marks">Name and marks</h2>
      <p>The Slate name and wordmark identify this project. Forks and derivatives are welcome under the MIT licence but must not present themselves as the official distribution or imply endorsement.</p>

      <h2 id="third-party">Third-party software</h2>
      <p>Slate bundles open-source components — Tauri, the system WebView, xterm.js, libgit2 bindings and others — each under its own licence. The complete list with texts is available in-app under Settings → About, and in the repository.</p>

      <h2 id="law">Governing law</h2>
      <p>These terms are governed by the laws of the jurisdiction in which the project maintainers are established, without regard to conflict-of-law rules. Mandatory consumer protections in your country of residence continue to apply.</p>

      <h2 id="contact">Contact</h2>
      <p><a className="link" href="mailto:hello@slate.tools">hello@slate.tools</a></p>
        </Reveal>
      </section>
    </>
  );
}
