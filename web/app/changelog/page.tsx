import type { Metadata } from "next";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Changelog",
  description: "Every Slate release in full, plus the roadmap. No background update checks.",
};

type Release = {
  v: string;
  date: string;
  pill?: string;
  groups: { h: string; items: string[] }[];
  note?: string;
};

const RELEASES: Release[] = [
  {
    v: "0.1.0",
    date: "14 July 2026",
    pill: "Current",
    groups: [
      {
        h: "Added",
        items: [
          "Reactive pane B with the deterministic burst classifier (spec / tree / diff).",
          "Six views: specs, changes, diff, search, activity, timeline.",
          "Real PTY terminal with tabs, your login shell and full scrollback.",
          "Replay — the last 20 bursts keep their diff snapshot.",
          "Approval prompts rendered beside the change they concern.",
          "Loopback override API on 127.0.0.1:8477, opt-in.",
          "Four themes and a command palette (⌘P).",
        ],
      },
      {
        h: "Known limitations",
        items: [
          "No Windows build yet.",
          "Replay depth is fixed at 20 bursts in memory; nothing persists across restarts.",
          "Search has no regex mode.",
        ],
      },
    ],
  },
  {
    v: "0.0.9",
    date: "28 June 2026 · beta",
    groups: [
      {
        h: "Fixed",
        items: [
          "Spec tree reveals full file names by horizontal scroll instead of truncating.",
          "A reactive redirect no longer yanks you out of a view while you are using pane B.",
          "Commit-box focus loss — endDrag was firing on every click.",
          "Root overflow locked; the app window never scrolls.",
        ],
      },
      { h: "Changed", items: ["Left and right pane headers share one height (41px) so they align."] },
    ],
  },
  {
    v: "Next",
    date: "Roadmap",
    groups: [
      {
        h: "Planned",
        items: [
          "Windows build (WebView2).",
          "Persisted replay across restarts.",
          "Per-workspace classifier overrides.",
          "Regex search and search-and-replace.",
        ],
      },
    ],
    note: "Dates are deliberately absent. They would be guesses.",
  },
];

export default function Page() {
  return (
    <>
      <section className="wrap phead">
        <div className="crumb tag">
          <span>Slate</span><span>/</span><span >Changelog</span>
        </div>
        <h1 className="h1">Every release, in full.</h1>
        <Reveal delay={0.15}>
          <p className="lead">
            Slate does not check for updates in the background — that would be a network call. This
            page and the GitHub releases feed are the only two places new versions appear.
          </p>
        </Reveal>
      </section>

      <section className="wrap" style={{ paddingBottom: 110 }}>
        {RELEASES.map((r) => (
          <Reveal className="rel" key={r.v}>
            <div className="rel-meta">
              <div className="rel-v">{r.v}</div>
              <div className="rel-d">{r.date}</div>
              {r.pill && <span className="pill">{r.pill}</span>}
            </div>
            <div>
              {r.groups.map((g) => (
                <div key={g.h}>
                  <h3>{g.h}</h3>
                  <ul>
                    {g.items.map((i) => <li key={i}>{i}</li>)}
                  </ul>
                </div>
              ))}
              {r.note && <p className="rel-note">{r.note}</p>}
            </div>
          </Reveal>
        ))}
      </section>
    </>
  );
}
