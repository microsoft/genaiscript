import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { diffParse, tryDiffParse, diffCreatePatch, diffFindChunk, diffResolve } from "./diff";

describe("diff", () => {
  test("diffParse - valid input", () => {
    const input = `
diff --git a/file1.txt b/file1.txt
index 83db48f..bf269f4 100644
--- a/file1.txt
+++ b/file1.txt
@@ -1,3 +1,3 @@
-Hello World
+Hello Universe
`;
    const result = diffParse(input);
    assert(result.length > 0, "Should parse diff into files");
    assert(result[0].chunks.length > 0, "Should parse chunks");
  });

  test("diffParse - empty input", () => {
    const input = "";
    const result = diffParse(input);
    assert.deepEqual(result, [], "Should return an empty array for empty input");
  });

  test("tryDiffParse - valid input", () => {
    const input = `
diff --git a/file1.txt b/file1.txt
index 83db48f..bf269f4 100644
--- a/file1.txt
+++ b/file1.txt
@@ -1,3 +1,3 @@
-Hello World
+Hello Universe
`;
    const result = tryDiffParse(input);
    assert(result, "Should parse diff successfully");
  });

  test("diffCreatePatch - valid input", () => {
    const left = { filename: "file1.txt", content: "Hello World\n" };
    const right = { filename: "file1.txt", content: "Hello Universe\n" };
    const patch = diffCreatePatch(left, right);
    assert(patch.includes("--- file1.txt"), "Should include original file header");
    assert(patch.includes("+++ file1.txt"), "Should include modified file header");
    assert(patch.includes("-Hello World"), "Should include removed line");
    assert(patch.includes("+Hello Universe"), "Should include added line");
  });

  test("diffFindChunk - find chunk by line", () => {
    const diff = [
      {
        to: "file1.txt",
        chunks: [
          {
            newStart: 1,
            newLines: 3,
          },
        ],
      },
    ];
    const result = diffFindChunk("file1.txt", 2, diff as any);
    assert(result?.chunk, "Should find the chunk containing the line");
  });

  test("diffFindChunk - file not found", () => {
    const diff = [
      {
        to: "file1.txt",
      },
    ];
    const result = diffFindChunk("file2.txt", 1, diff as any);
    assert.strictEqual(result, undefined, "Should return undefined if file is not found");
  });

  test("diffFindChunk - line not in any chunk", () => {
    const diff = [
      {
        to: "file1.txt",
        chunks: [
          {
            newStart: 10,
            newLines: 5,
          },
        ],
      },
    ];
    const result = diffFindChunk("file1.txt", 2, diff as any);
    assert(result?.file, "Should return the file even if no chunk matches");
    assert.strictEqual(
      result?.chunk,
      undefined,
      "Should not return a chunk if line is not in range",
    );
  });
  test("diffResolve - string input", () => {
    const input = `
diff --git a/file1.txt b/file1.txt
index 83db48f..bf269f4 100644
--- a/file1.txt
+++ b/file1.txt
@@ -1,3 +1,3 @@
-Hello World
+Hello Universe
`;
    const result = diffResolve(input);
    assert(Array.isArray(result), "Should return an array");
    assert(result.length > 0, "Should parse diff into files");
    assert(result[0].chunks.length > 0, "Should parse chunks");
  });

  test("diffResolve - empty string input", () => {
    const input = "";
    const result = diffResolve(input);
    assert.deepEqual(result, [], "Should return an empty array for empty string input");
  });

  test("diffResolve - array input", () => {
    const input = [
      {
        to: "file1.txt",
        chunks: [
          {
            newStart: 1,
            newLines: 3,
            oldStart: 1,
            oldLines: 3,
          },
        ],
      },
    ];
    const result = diffResolve(input as DiffFile[]);
    assert.deepEqual(result, input, "Should return the same array when array is provided");
  });

  test("diffResolve - single object input", () => {
    const input = {
      to: "file1.txt",
      chunks: [
        {
          newStart: 1,
          newLines: 3,
          oldStart: 1,
          oldLines: 3,
        },
      ],
    };
    const result = diffResolve(input as DiffFile);
    assert.deepEqual(result, [input], "Should wrap single object in an array");
  });
});
