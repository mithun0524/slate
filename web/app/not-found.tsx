import Link from "next/link";
import { Reveal } from "@/components/Reveal";

export default function NotFound() {
  return (
    <section className="nf wrap">
      <div className="code">Error 404</div><h1 className="h2">Page not found</h1>
      <Reveal delay={0.1}>
        <p className="lead">
          That page does not exist. The classifier would have shown you something useful; a web
          server can only shrug.
        </p>
        <div className="nf-act">
          <Link className="btn btn-fill" href="/">Home</Link>
          <Link className="btn" href="/docs">Documentation</Link>
          <Link className="btn" href="/download">Download</Link>
        </div>
      </Reveal>
    </section>
  );
}
