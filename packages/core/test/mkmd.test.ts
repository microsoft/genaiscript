// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, it, assert } from "vitest";
import { fenceMD, link, details } from "../src/mkmd.js";

describe("mkmd", () => {
  describe("fenceMD", () => {
    it("should wrap text in code fence", () => {
      const result = fenceMD("test");
      assert.equal(result, "\n```\ntest\n```\n");
    });

    it("should add content type to fence", () => {
      const result = fenceMD("test", "typescript");
      assert.equal(result, "\n```ts\ntest\n```\n");
    });

    it("should map content types appropriately", () => {
      assert.equal(fenceMD("test", "markdown"), "\n```md\ntest\n```\n");
      assert.equal(fenceMD("test", "prompty"), "\n```md\ntest\n```\n");
      assert.equal(fenceMD("test", "javascript"), "\n```js\ntest\n```\n");
      assert.equal(fenceMD("test", "yml"), "\n```yaml\ntest\n```\n");
    });

    it("should extend fence when content contains fence", () => {
      const result = fenceMD("```test```");
      assert.equal(result, "\n````\n```test```\n````\n");
    });

    it("should extend fence multiple times if needed", () => {
      const result = fenceMD("````test````");
      assert.equal(result, "\n`````\n````test````\n`````\n");
    });

    it("should return undefined when input is undefined", () => {
      assert.equal(fenceMD(undefined), undefined);
    });

    it("should trim newlines from the input", () => {
      const result = fenceMD("\ntest\n\n");
      assert.equal(result, "\n```\ntest\n```\n");
    });
  });

  describe("link", () => {
    it("should create a markdown link when href is provided", () => {
      const result = link("text", "https://example.com");
      assert.equal(result, "[text](https://example.com)");
    });

    it("should return plain text when href is not provided", () => {
      const result = link("text", "");
      assert.equal(result, "text");
    });
  });

  describe("details", () => {
    it("should create a markdown details block", () => {
      const result = details("Summary", "Body content");
      assert.equal(
        result,
        "\n<details>\n<summary>Summary</summary>\n\nBody content\n\n</details>\n",
      );
    });

    it("should create an open details block when specified", () => {
      const result = details("Summary", "Body content", true);
      assert.equal(
        result,
        "\n<details open>\n<summary>Summary</summary>\n\nBody content\n\n</details>\n",
      );
    });
  });
});
