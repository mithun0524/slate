import { describe, expect, it } from "vitest";
import { parseDiff } from "./DiffView";

const PATCH = `diff --git a/src/a.ts b/src/a.ts
index 111..222 100644
--- a/src/a.ts
+++ b/src/a.ts
@@ -1,4 +1,4 @@
 const x = 1;
-const y = 2;
+const y = 3;
 const z = 4;
diff --git a/img.png b/img.png
index 333..444 100644
Binary files a/img.png and b/img.png differ
`;

describe("parseDiff", () => {
  it("splits files, counts lines and numbers both sides", () => {
    const files = parseDiff(PATCH);
    expect(files.map((f) => f.path)).toEqual(["src/a.ts", "img.png"]);

    const a = files[0];
    expect(a.additions).toBe(1);
    expect(a.deletions).toBe(1);
    expect(a.hunks).toHaveLength(1);

    const kinds = a.hunks[0].lines.map((l) => `${l.type}:${l.oldNo ?? "-"}:${l.newNo ?? "-"}`);
    expect(kinds).toEqual(["ctx:1:1", "del:2:-", "add:-:2", "ctx:3:3"]);
  });

  it("flags binary files instead of inventing a diff", () => {
    const png = parseDiff(PATCH)[1];
    expect(png.binary).toBe(true);
    expect(png.hunks).toHaveLength(0);
  });

  it("returns nothing for empty or non-diff input", () => {
    expect(parseDiff("")).toEqual([]);
    expect(parseDiff("just some text\n")).toEqual([]);
  });

  it("handles a new file (no old side)", () => {
    const files = parseDiff(`diff --git a/new.ts b/new.ts
new file mode 100644
index 000..111
--- /dev/null
+++ b/new.ts
@@ -0,0 +1,2 @@
+one
+two
`);
    expect(files).toHaveLength(1);
    expect(files[0].additions).toBe(2);
    expect(files[0].deletions).toBe(0);
    expect(files[0].hunks[0].lines.every((l) => l.oldNo === null)).toBe(true);
  });

  it("keeps a blank source line but drops diff noise", () => {
    // " " is a real empty context line; "" (from the trailing newline) and
    // "\\ No newline at end of file" are not lines at all — if they leak
    // through they render as phantom rows and shift every line number after.
    const files = parseDiff(
      "diff --git a/x.ts b/x.ts\n--- a/x.ts\n+++ b/x.ts\n@@ -1,3 +1,3 @@\n a\n \n-b\n+c\n\\ No newline at end of file\n",
    );
    const kinds = files[0].hunks[0].lines.map((l) => `${l.type}:${l.text}`);
    expect(kinds).toEqual(["ctx:a", "ctx:", "del:b", "add:c"]);
    expect(files[0].hunks[0].lines[1].oldNo).toBe(2);
  });
});
