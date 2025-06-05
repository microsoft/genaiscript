// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, it, assert } from "vitest";
import { chunkString, chunkLines } from "../src/chunkers.js";

describe("chunkers", () => {
  describe("chunkString", () => {
    it("should return empty array for empty string", () => {
      assert.deepEqual(chunkString(""), []);
      assert.deepEqual(chunkString(null as any), []);
      assert.deepEqual(chunkString(undefined as any), []);
    });

    it("should return the string as is if smaller than chunk size", () => {
      const str = "hello world";
      assert.deepEqual(chunkString(str, 20), [str]);
    });

    it("should chunk string into equal parts", () => {
      const str = "abcdefghijklmnopqrstuvwxyz";
      assert.deepEqual(chunkString(str, 10), ["abcdefghij", "klmnopqrst", "uvwxyz"]);
    });

    it("should use the default chunk size if not provided", () => {
      const longString = "a".repeat(2 << 15); // Longer than default chunk size
      const chunks = chunkString(longString);
      assert(chunks.length > 1);
      assert(chunks[0].length === 2 << 14);
    });
  });

  describe("chunkLines", () => {
    it("should return empty array for empty string", () => {
      assert.deepEqual(chunkLines(""), []);
      assert.deepEqual(chunkLines(null as any), []);
      assert.deepEqual(chunkLines(undefined as any), []);
    });

    it("should return the string as is if smaller than chunk size", () => {
      const str = "hello world";
      assert.deepEqual(chunkLines(str, 20), [str]);
    });

    it("should preserve line breaks when chunking", () => {
      const str = "line1\nline2\nline3\nline4";
      assert.deepEqual(chunkLines(str, 12), ["line1\nline2\n", "line3\nline4\n"]);
    });

    it("should handle CRLF line endings", () => {
      const str = "line1\r\nline2\r\nline3\r\nline4";
      assert.deepEqual(chunkLines(str, 14), ["line1\nline2\n", "line3\nline4\n"]);
    });

    it("should keep lines together even if they exceed chunk size", () => {
      const str = "short\nvery_long_line_exceeding_chunk_size\nshort";
      const chunks = chunkLines(str, 10);
      assert.equal(chunks.length, 3);
      assert.equal(chunks[0], "short\n");
      assert.equal(chunks[1], "very_long_line_exceeding_chunk_size\n");
      assert.equal(chunks[2], "short\n");
    });

    it("should use the default chunk size if not provided", () => {
      const longString = "line\n".repeat(2 << 13); // Longer than default chunk size
      const chunks = chunkLines(longString);
      assert(chunks.length > 1);
    });
  });
});
