// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, test, assert, beforeEach } from "vitest";
import { grepSearch } from "../src/grep.js";
import { TestHost } from "../src/testhost.js";

// testmarker = aojkhsdfvfaweiojhfwqepiouiasdojhvfadshjoasdf

describe("grepSearch (integration)", async () => {
  beforeEach(() => {
    TestHost.install();
  });

  test("** glob", async () => {
    const result = await grepSearch("draft-07", {
      glob: "**/*.json",
      debug: true,
    });
    assert(result.files.length > 0, "found files");
    assert.ok(result.matches.some((m) => typeof m.filename === "string"));
  });

  test("should support RegExp pattern and ignoreCase", async () => {
    const result = await grepSearch(/grep/i, {
      glob: ["*.ts"],
      path: "src",
    });
    assert(result.files.some((f) => typeof f.filename === "string"));
    assert(result.matches.some((m) => typeof m.filename === "string"));
  });

  test("should not read file content if readText is false", async () => {
    const result = await grepSearch("grep", {
      glob: "*.ts",
      path: "src",
      readText: false,
    });
    assert(result.files.every((f) => !("content" in f)));
  });

  test("should bypass .gitignore filtering if applyGitIgnore is false", async () => {
    const result = await grepSearch("aojkhsdfvfaweiojhfwqepiouiasdojhvfadshjoasdf", {
      glob: "*.ts",
      applyGitIgnore: false,
    });
    assert(Array.isArray(result.files));
  });

  test("should return files and matches for string pattern", async () => {
    const result = await grepSearch("aojkhsdfvfaweiojhfwqepiouiasdojhvfadshjoasdf", {
      glob: "*.ts",
      path: import.meta.dirname,
    });
    console.log(result);
    assert(Array.isArray(result.files), "found files");
    assert(Array.isArray(result.matches), "found matches");
    assert(
      result.files.some((f) => typeof f.filename === "string"),
      "files have names",
    );
    assert(
      result.matches.every((m) => typeof m.filename === "string" && typeof m.content === "string"),
      "files have content",
    );
    assert(result.files.length === 1, "found one file");
    assert(result.files[0].filename.endsWith("test/grep.test.ts"), "correct file");
  });
});
