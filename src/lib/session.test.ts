import { describe, expect, it, beforeEach } from "vitest";
import {
  DEFAULT_SESSION,
  cleanSession,
  loadSession,
  maxTermSeq,
  saveSession,
} from "./session";

describe("cleanSession", () => {
  it("falls back to defaults for junk", () => {
    for (const junk of [null, undefined, 0, "x", [], {}, { terms: "nope" }]) {
      expect(cleanSession(junk)).toEqual(DEFAULT_SESSION);
    }
  });

  it("keeps a valid session verbatim", () => {
    const s = {
      terms: [
        { id: "t1", title: "Terminal 1" },
        { id: "t4", title: "build" },
      ],
      activeTerm: "t4",
      split: 0.33,
      intent: { kind: "spec", path: "docs/a.md" },
      pinned: true,
    };
    expect(cleanSession(s)).toEqual(s);
  });

  it("drops malformed and duplicate terminals", () => {
    const s = cleanSession({
      terms: [
        { id: "t1", title: "one" },
        { id: "t1", title: "dupe" },
        { id: "", title: "empty id" },
        { title: "no id" },
        null,
      ],
      activeTerm: "t1",
    });
    expect(s.terms).toEqual([{ id: "t1", title: "one" }]);
  });

  it("repoints activeTerm when it names a terminal that is gone", () => {
    const s = cleanSession({
      terms: [{ id: "t2", title: "two" }],
      activeTerm: "t9",
    });
    expect(s.activeTerm).toBe("t2");
  });

  it("clamps the split to the draggable range", () => {
    expect(cleanSession({ split: 5 }).split).toBe(0.8);
    expect(cleanSession({ split: -2 }).split).toBe(0.2);
    expect(cleanSession({ split: NaN }).split).toBe(DEFAULT_SESSION.split);
    expect(cleanSession({ split: "0.4" }).split).toBe(DEFAULT_SESSION.split);
  });

  it("rejects intents it cannot render", () => {
    const terms = [{ id: "t1", title: "one" }];
    // unknown kind (older/newer build)
    expect(cleanSession({ terms, intent: { kind: "hologram" } }).intent).toEqual({ kind: "tree" });
    // spec with no path would render an empty document
    expect(cleanSession({ terms, intent: { kind: "spec" } }).intent).toEqual({ kind: "tree" });
    // diff paths must be strings
    expect(cleanSession({ terms, intent: { kind: "diff", paths: ["a.ts", 7, null] } }).intent).toEqual(
      { kind: "diff", paths: ["a.ts"] },
    );
    expect(cleanSession({ terms, intent: { kind: "activity" } }).intent).toEqual({
      kind: "activity",
    });
  });
});

describe("maxTermSeq", () => {
  it("finds the highest tN so new terminals never reuse an id", () => {
    expect(maxTermSeq([{ id: "t1", title: "" }, { id: "t7", title: "" }])).toBe(7);
    expect(maxTermSeq([{ id: "shell", title: "" }])).toBe(0);
    expect(maxTermSeq([])).toBe(0);
  });
});

describe("load/save round trip", () => {
  beforeEach(() => localStorage.clear());

  it("restores what was saved, per workspace", () => {
    const a = {
      terms: [{ id: "t1", title: "Terminal 1" }],
      activeTerm: "t1",
      split: 0.7,
      intent: { kind: "log" as const },
      pinned: false,
    };
    saveSession("/repo/a", a);
    expect(loadSession("/repo/a")).toEqual(a);
    // A different workspace must not inherit it.
    expect(loadSession("/repo/b")).toEqual(DEFAULT_SESSION);
  });

  it("survives corrupt storage", () => {
    localStorage.setItem("vellum.session:/repo/a", "{not json");
    expect(loadSession("/repo/a")).toEqual(DEFAULT_SESSION);
  });

  it("is a no-op without a workspace path", () => {
    saveSession("", DEFAULT_SESSION);
    expect(localStorage.length).toBe(0);
    expect(loadSession("")).toEqual(DEFAULT_SESSION);
  });
});
