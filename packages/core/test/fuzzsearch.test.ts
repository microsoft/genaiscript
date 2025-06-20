// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, test, assert, beforeEach } from "vitest";
import { fuzzSearch } from "../src/fuzzsearch.js";
import { TestHost } from "../src/testhost.js";

describe("fuzzSearch", () => {
  beforeEach(() => {
    TestHost.install();
  });

  test("should return correct search results with expected scores", async () => {
    const query = "sample query";
    const files: Partial<WorkspaceFile>[] = [
      { filename: "test1.md", content: "sample for test1 file content" },
      {
        filename: "test2.md",
        content: "example content for file test2 sample",
      },
    ];
    const options = { topK: 2 };

    const results = await fuzzSearch(query, files as WorkspaceFile[], options);

    console.log("Test results:", results); // Debugging: log test results

    assert.equal(results.length, 2);
    assert.equal(results[0].filename, "test1.md");
    assert.equal(results[0].content, "sample for test1 file content");
    assert.equal(typeof results[0].score, "number");
  });

  test("should handle empty file list", async () => {
    const query = "sample query";
    const files: WorkspaceFile[] = [];

    const results = await fuzzSearch(query, files);

    assert.equal(results.length, 0);
  });

  test("should perform correctly with no options provided", async () => {
    const query = "sample query";
    const files: Partial<WorkspaceFile>[] = [
      { filename: "test1.md", content: "sample for test1 file content" },
      {
        filename: "test2.md",
        content: "example content for file test2 sample",
      },
    ];

    const results = await fuzzSearch(query, files as WorkspaceFile[]);

    console.log("Test results:", results); // Debugging: log test results

    assert.equal(results.length, 2);
    assert.equal(results[0].filename, "test1.md");
    assert.equal(results[0].content, "sample for test1 file content");
    assert.equal(typeof results[0].score, "number");
  });
});
