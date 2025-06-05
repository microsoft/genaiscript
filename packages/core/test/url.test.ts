// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, test, assert } from "vitest";
import { uriRedact } from "../src/url.js";

describe("url", () => {
  describe("ellipseUri", () => {
    test("returns undefined for invalid URLs", () => {
      assert.strictEqual(uriRedact("not-a-url"), undefined);
      assert.strictEqual(uriRedact(""), undefined);
      assert.strictEqual(uriRedact("http:"), undefined);
    });

    test("shortens URLs with only protocol, hostname, and pathname", () => {
      assert.strictEqual(uriRedact("https://example.com"), "https://example.com/");
      assert.strictEqual(uriRedact("http://example.org/path"), "http://example.org/path");
      assert.strictEqual(
        uriRedact("https://sub.domain.com/path/to/resource"),
        "https://sub.domain.com/path/to/resource",
      );
    });

    test("adds ellipses for query parameters", () => {
      assert.strictEqual(uriRedact("https://example.com?param=value"), "https://example.com/?...");
      assert.strictEqual(
        uriRedact("https://example.com/path?param=value&other=123"),
        "https://example.com/path?...",
      );
    });

    test("adds ellipses for fragments", () => {
      assert.strictEqual(uriRedact("https://example.com#section"), "https://example.com/#...");
      assert.strictEqual(
        uriRedact("https://example.com/path#section"),
        "https://example.com/path#...",
      );
    });

    test("handles URLs with both query parameters and fragments", () => {
      assert.strictEqual(
        uriRedact("https://example.com?param=value#section"),
        "https://example.com/?...#...",
      );
      assert.strictEqual(
        uriRedact("https://example.com/path?param=value#section"),
        "https://example.com/path?...#...",
      );
    });
  });
});
