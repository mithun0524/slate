"use client";

import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";

const ITEMS: { q: string; a: ReactNode }[] = [
  {
    q: "Which agents work with it?",
    a: (
      <>
        All of them. Slate watches the filesystem, not the agent. Claude Code, Codex,
        Gemini CLI, aider, a bash script, or you editing by hand — the pane reacts the same way.
      </>
    ),
  },
  {
    q: "Do I give up my terminal?",
    a: (
      <>
        No. Real PTY, your shell, your dotfiles, your prompt. Slate adds a pane; it replaces
        nothing you already type.
      </>
    ),
  },
  {
    q: "Does my code leave the machine?",
    a: (
      <>
        Never. No account, no sync, no analytics. The only listener is loopback{" "}
        <code>:8477</code> for the optional agent override, and you can leave it off. See{" "}
        <Link className="link" href="/privacy">privacy</Link>.
      </>
    ),
  },
  {
    q: "What does it cost?",
    a: (
      <>
        Nothing. MIT licensed — <Link className="link" href="/download">download it</Link> and use it.
      </>
    ),
  },
];

function Row({ q, a }: { q: string; a: ReactNode }) {
  const [open, setOpen] = useState(false);
  const body = useRef<HTMLDivElement>(null);

  return (
    <div className={`faq-row ${open ? "open" : ""}`}>
      <button
        type="button"
        className="faq-q"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span>{q}</span>
        <i aria-hidden="true" />
      </button>
      <div
        className="faq-a"
        ref={body}
        style={{ height: open ? body.current?.scrollHeight ?? "auto" : 0 }}
      >
        <p>{a}</p>
      </div>
    </div>
  );
}

export default function Faq() {
  return (
    <div className="faq">
      {ITEMS.map((it) => (
        <Row key={it.q} {...it} />
      ))}
    </div>
  );
}
