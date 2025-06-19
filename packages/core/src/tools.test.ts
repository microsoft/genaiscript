import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { escapeToolName, isToolsSupported } from "./tools";

describe("escapeToolName", () => {
  test("should replace non-alphanumeric characters with underscores", () => {
    assert.strictEqual(escapeToolName("tool-name!@#"), "tool_name");
  });

  test("should replace hyphens with underscores", () => {
    assert.strictEqual(escapeToolName("tool-name"), "tool_name");
  });

  test("should replace multiple underscores with a single underscore", () => {
    assert.strictEqual(escapeToolName("tool__name"), "tool_name");
  });

  test("should handle empty string", () => {
    assert.strictEqual(escapeToolName(""), "");
  });
});

describe("isToolsSupported", () => {
  test("should return undefined for empty modelId", () => {
    assert.strictEqual(isToolsSupported(""), undefined);
  });

  test("should return false for unsupported model family", () => {
    const modelId = "another:o1-mini";
    assert.strictEqual(isToolsSupported(modelId), false);
  });

  test("should return false for provider with tools set to false", () => {
    const modelId = "openai:o1-preview";
    assert.strictEqual(isToolsSupported(modelId), false);
  });
  test("should return false for provider with tools with tag set to false", () => {
    const modelId = "ollama:gemma3:4b";
    assert.strictEqual(isToolsSupported(modelId), false);
  });

  test("should return undefined for supported model", () => {
    const modelId = "another:foo";
    assert.strictEqual(isToolsSupported(modelId), undefined);
  });
});
