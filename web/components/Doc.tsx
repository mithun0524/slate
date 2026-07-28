"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

/* Docs page frame: prose column + a table of contents that tracks the
   heading you're actually reading. */

export type TocItem = { id: string; label: string };

export default function Doc({
  kicker,
  title,
  lead,
  toc,
  prev,
  next,
  children,
}: {
  kicker: string;
  title: string;
  lead: string;
  toc: TocItem[];
  prev?: [string, string];
  next?: [string, string];
  children: ReactNode;
}) {
  const [active, setActive] = useState(toc[0]?.id);

  useEffect(() => {
    const targets = toc
      .map((t) => document.getElementById(t.id))
      .filter((el): el is HTMLElement => !!el);
    if (!targets.length) return;
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => e.isIntersecting && setActive(e.target.id));
      },
      { rootMargin: "-90px 0px -68% 0px" }
    );
    targets.forEach((t) => spy.observe(t));
    return () => spy.disconnect();
  }, [toc]);

  return (
    <>
      <article className="prose" data-route-fade>
        <div className="tag">{kicker}</div>
        <h1 >{title}</h1>
        <p className="lead">{lead}</p>

        <details className="toc-inline">
          <summary>On this page</summary>
          <div>
            {toc.map((x) => (
              <a key={x.id} href={`#${x.id}`}>{x.label}</a>
            ))}
          </div>
        </details>

        {children}
        {(prev || next) && (
          <div className="pager">
            {prev ? (
              <Link href={prev[0]}>
                <span className="tag">Previous</span>
                <span className="t">{prev[1]}</span>
              </Link>
            ) : <span />}
            {next && (
              <Link className="nx" href={next[0]}>
                <span className="tag">Next</span>
                <span className="t">{next[1]}</span>
              </Link>
            )}
          </div>
        )}
      </article>

      <nav className="toc" aria-label="On this page">
        <h4>On this page</h4>
        {toc.map((t) => (
          <a key={t.id} href={`#${t.id}`} className={active === t.id ? "on" : ""}>
            {t.label}
          </a>
        ))}
      </nav>
    </>
  );
}
