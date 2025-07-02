import { assert, describe, test } from "vitest";
import { levenshteinDistance } from "../src/levenshtein.js";

describe("levenshteinDistance", () => {
  test("should return 0 for identical strings", async () => {
    const result = await levenshteinDistance("hello", "hello");
    assert.equal(result, 0);
  });

  test("should return string length for empty vs non-empty string", async () => {
    const result = await levenshteinDistance("", "hello");
    assert.equal(result, 5);
  });

  test("should return string length for non-empty vs empty string", async () => {
    const result = await levenshteinDistance("hello", "");
    assert.equal(result, 5);
  });
  test("should return correct distance for different strings", async () => {
    const result = await levenshteinDistance("kitten", "sitting");
    assert.equal(result, 3);
  });

  test("should return correct distance for similar strings", async () => {
    const result = await levenshteinDistance("flaw", "lawn");
    assert.equal(result, 2);
  });

  test("should return correct distance for completely different strings", async () => {
    const result = await levenshteinDistance("abc", "xyz");
    assert.equal(result, 3);
  });
});
