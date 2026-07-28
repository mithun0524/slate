import { Fragment, type ReactNode } from "react";

/* Minimal token colouring — comments, strings, a few keywords. Not a parser
   and not trying to be: these are four-line illustrations, and a real
   highlighter would outweigh every snippet on the site combined. */

const KEYWORDS =
  /\b(if|else|return|pub|struct|fn|let|const|use|impl|match|curl|sudo|export)\b/g;

function keywords(text: string, k: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  KEYWORDS.lastIndex = 0;
  while ((m = KEYWORDS.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(<span className="k" key={`${k}k${i++}`}>{m[0]}</span>);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function line(src: string, n: number): ReactNode {
  const key = `l${n}`;

  const c = src.search(/(^|\s)(\/\/|#)/);
  if (c !== -1) {
    return (
      <Fragment key={key}>
        {keywords(src.slice(0, c), key)}
        <span className="c">{src.slice(c)}</span>
        {"\n"}
      </Fragment>
    );
  }

  const out: ReactNode[] = [];
  const re = /('[^']*'|"[^"]*")/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(src))) {
    out.push(...keywords(src.slice(last, m.index), key + i));
    out.push(<span className="s" key={`${key}s${i++}`}>{m[0]}</span>);
    last = m.index + m[0].length;
  }
  out.push(...keywords(src.slice(last), key + "end"));

  return (
    <Fragment key={key}>
      {out}
      {"\n"}
    </Fragment>
  );
}

export default function Code({
  code,
  className = "code",
}: {
  code: string;
  className?: string;
}) {
  return (
    <pre className={className}>
      <code>{code.replace(/^\n/, "").trimEnd().split("\n").map(line)}</code>
    </pre>
  );
}
