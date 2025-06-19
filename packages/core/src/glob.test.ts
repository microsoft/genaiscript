import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { isGlobMatch } from "./glob";

describe("glob", () => {
  describe("isGlobMatch", () => {
    test("matches single pattern", () => {
      assert.equal(isGlobMatch("file.txt", "*.txt"), true);
      assert.equal(isGlobMatch("file.jpg", "*.txt"), false);
    });

    test("matches array of patterns", () => {
      const patterns = ["*.txt", "*.md", "*.doc"];
      assert.equal(isGlobMatch("readme.md", patterns), true);
      assert.equal(isGlobMatch("image.png", patterns), false);
    });

    test("handles Windows paths", () => {
      assert.equal(isGlobMatch("folder\\file.txt", "**/*.txt"), true);
      assert.equal(isGlobMatch("folder\\subfolder\\file.txt", "**/*.txt"), true);
    });

    test("handles matchBase option", () => {
      assert.equal(isGlobMatch("path/to/file.txt", "*.txt", { matchBase: true }), true);
      assert.equal(isGlobMatch("path/to/file.txt", "*.txt", { matchBase: false }), false);
    });

    test("handles exact matches", () => {
      assert.equal(isGlobMatch("exact-file.txt", "exact-file.txt"), true);
      assert.equal(isGlobMatch("different-file.txt", "exact-file.txt"), false);
    });
  });
});
