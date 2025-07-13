import { describe, test } from "vitest";
import assert from "node:assert/strict";
import { evaluateTestResult } from "../src/testeval.js";
import { PromptTest, PromptScript, PromptAssertion } from "../src/types.js";
import { GenerationResult } from "../src/server/messages.js";

describe("evaluateTestResult", () => {
  const mockScript: PromptScript = {
    id: "test-script",
    title: "Test Script",
    description: "A test script",
  } as PromptScript;

  const mockConfig = {
    script: mockScript,
    test: {} as PromptTest,
    options: {},
  };

  const mockResult: GenerationResult = {
    status: "success",
    text: "Hello World Test",
    error: undefined,
  } as GenerationResult;

  test("should pass for icontains assertion", async () => {
    const testConfig = {
      ...mockConfig,
      test: {
        asserts: [{ type: "icontains", value: "hello" }],
      } as PromptTest,
    };

    const result = await evaluateTestResult(testConfig, mockResult);
    assert.equal(result, undefined);
  });

  test("should fail for icontains assertion", async () => {
    const testConfig = {
      ...mockConfig,
      test: {
        asserts: [{ type: "icontains", value: "missing" }],
      } as PromptTest,
    };

    const result = await evaluateTestResult(testConfig, mockResult);
    assert.equal(result, "assertion failed: icontains('missing')");
  });

  test("should pass for not-icontains assertion", async () => {
    const testConfig = {
      ...mockConfig,
      test: {
        asserts: [{ type: "not-icontains", value: "missing" }],
      } as PromptTest,
    };

    const result = await evaluateTestResult(testConfig, mockResult);
    assert.equal(result, undefined);
  });

  test("should pass for equals assertion", async () => {
    const testConfig = {
      ...mockConfig,
      test: {
        asserts: [{ type: "equals", value: "Hello World Test" }],
      } as PromptTest,
    };

    const result = await evaluateTestResult(testConfig, mockResult);
    assert.equal(result, undefined);
  });

  test("should pass for starts-with assertion", async () => {
    const testConfig = {
      ...mockConfig,
      test: {
        asserts: [{ type: "starts-with", value: "Hello" }],
      } as PromptTest,
    };

    const result = await evaluateTestResult(testConfig, mockResult);
    assert.equal(result, undefined);
  });

  test("should pass for contains-all assertion", async () => {
    const testConfig = {
      ...mockConfig,
      test: {
        asserts: [{ type: "contains-all", value: ["hello", "world"] }],
      } as PromptTest,
    };

    const result = await evaluateTestResult(testConfig, mockResult);
    assert.equal(result, undefined);
  });

  test("should fail for contains-all assertion", async () => {
    const testConfig = {
      ...mockConfig,
      test: {
        asserts: [{ type: "contains-all", value: ["hello", "missing"] }],
      } as PromptTest,
    };

    const result = await evaluateTestResult(testConfig, mockResult);
    assert.equal(result, "assertion failed: contains-all([hello, missing])");
  });

  test("should pass for contains-any assertion", async () => {
    const testConfig = {
      ...mockConfig,
      test: {
        asserts: [{ type: "contains-any", value: ["hello", "missing"] }],
      } as PromptTest,
    };

    const result = await evaluateTestResult(testConfig, mockResult);
    assert.equal(result, undefined);
  });

  test("should pass for levenshtein assertion", async () => {
    const testConfig = {
      ...mockConfig,
      test: {
        asserts: [{ type: "levenshtein", value: "Hello World Test!", threshold: 1 }],
      } as PromptTest,
    };

    const result = await evaluateTestResult(testConfig, mockResult);
    assert.equal(result, undefined);
  });

  test("should fail for levenshtein assertion", async () => {
    const testConfig = {
      ...mockConfig,
      test: {
        asserts: [{ type: "levenshtein", value: "Completely Different", threshold: 1 }],
      } as PromptTest,
    };

    const result = await evaluateTestResult(testConfig, mockResult);
    assert.equal(result, "assertion failed: levenshtein('Completely Different')");
  });

  test("should pass for not-levenshtein assertion", async () => {
    const testConfig = {
      ...mockConfig,
      test: {
        asserts: [{ type: "not-levenshtein", value: "Completely Different", threshold: 5 }],
      } as PromptTest,
    };

    const result = await evaluateTestResult(testConfig, mockResult);
    assert.equal(result, undefined);
  });

  test("should handle multiple assertions", async () => {
    const testConfig = {
      ...mockConfig,
      test: {
        asserts: [
          { type: "icontains", value: "hello" },
          { type: "starts-with", value: "Hello" },
          { type: "contains-any", value: ["world", "test"] },
        ],
      } as PromptTest,
    };

    const result = await evaluateTestResult(testConfig, mockResult);
    assert.equal(result, undefined);
  });

  test("should handle error status", async () => {
    const errorResult: GenerationResult = {
      status: "error",
      text: "",
      error: { message: "Test error" } as Error,
    } as GenerationResult;

    const result = await evaluateTestResult(mockConfig, errorResult);
    assert.equal(result, "error: Test error");
  });

  test("should handle non-success status", async () => {
    const cancelledResult: GenerationResult = {
      status: "cancelled",
      text: "",
      error: undefined,
    } as GenerationResult;

    const result = await evaluateTestResult(mockConfig, cancelledResult);
    assert.equal(result, "cancelled");
  });

  test("should handle unknown assertion type", async () => {
    const testConfig = {
      ...mockConfig,
      test: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        asserts: [{ type: "unknown-type", value: "test" } as any as PromptAssertion],
      },
    };

    const result = await evaluateTestResult(testConfig, mockResult);
    assert.equal(result, "unknown assertion type: unknown-type");
  });
});
