// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, test, assert } from "vitest";
import { markdownDiff } from "../src/mddiff.js";

describe("markdownDiff", () => {
  test("should return fenced code block when oldStr is undefined", () => {
    const result = markdownDiff(undefined, "test content", { lang: "ts" });
    assert.equal(result, "\n```ts\ntest content\n```\n");
  });

  test("should handle empty strings", () => {
    const result = markdownDiff("", "", { lang: "js" });
    assert.equal(result, "\n```diff\n\n```\n");
  });

  test("should show additions with + prefix", () => {
    const result = markdownDiff("line 1", "line 1\nline 2", { lang: "txt" });
    assert.equal(result, "\n```diff\n-line 1+line 1\nline 2\n```\n");
  });

  test("should show removals with - prefix", () => {
    const result = markdownDiff("line 1\nline 2", "line 1", { lang: "txt" });
    assert.equal(result, "\n```diff\n-line 1\nline 2+line 1\n```\n");
  });

  test("should handle options.ignoreWhitespace", () => {
    const result = markdownDiff("line  1", "line 1", {
      ignoreWhitespace: true,
    });
    assert.equal(result, "\n```diff\n-line  1+line 1\n```\n");
  });
});
