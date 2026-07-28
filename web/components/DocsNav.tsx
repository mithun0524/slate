"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export const SECTIONS = [
  {
    h: "Start",
    items: [
      ["/docs", "Getting started"],
      ["/docs/concepts", "Concepts"],
    ],
  },
  {
    h: "Using Slate",
    items: [
      ["/docs/views", "The six views"],
      ["/docs/shortcuts", "Keyboard shortcuts"],
      ["/docs/config", "Configuration"],
    ],
  },
  { h: "Extending", items: [["/docs/api", "Override API"]] },
  { h: "Help", items: [["/docs/troubleshooting", "Troubleshooting"]] },
];

export default function DocsNav() {
  const pathname = usePathname();
  return (
    <nav className="dnav" aria-label="Documentation">
      {SECTIONS.map((s) => (
        <div key={s.h}>
          <h4>{s.h}</h4>
          {s.items.map(([href, label]) => (
            <Link key={href} href={href} aria-current={pathname === href ? "page" : undefined}>
              {label}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}
