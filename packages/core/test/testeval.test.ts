import { describe, test, vi, beforeEach } from "vitest";
import assert from "node:assert/strict";
import { evaluateTestResult } from "../src/testeval.js";
import { PromptTest, PromptScript, PromptAssertion } from "../src/types.js";
import { GenerationResult } from "../src/server/messages.js";

// Mock the classify function from runtime
vi.mock("@genaiscript/runtime", () => ({
  classify: vi.fn(),
}));

import { classify } from "@genaiscript/runtime";

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

  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  test("should pass for fact assertion with consistent content", async () => {
    // Mock classify function to return consistent
    vi.mocked(classify).mockResolvedValue({
      label: "consistent",
      answer: "Content matches fact",
    });

    const testConfig = {
      ...mockConfig,
      test: {
        facts: ["Hello World Test"],
      } as PromptTest,
    };

    const result = await evaluateTestResult(testConfig, mockResult);
    assert.equal(result, undefined);
  });

  test("should fail for fact assertion with inconsistent content", async () => {
    // Mock classify function to return inconsistent
    vi.mocked(classify).mockResolvedValue({
      label: "inconsistent",
      answer: "Content does not match fact",
    });

    const testConfig = {
      ...mockConfig,
      test: {
        facts: ["This is completely different content"],
      } as PromptTest,
    };

    const result = await evaluateTestResult(testConfig, mockResult);
    assert.equal(result, "fact assertion failed: output is not factually consistent with 'This is completely different content'");
  });

  test("should handle multiple fact assertions", async () => {
    // Mock classify function to always return consistent
    vi.mocked(classify).mockResolvedValue({
      label: "consistent",
      answer: "Content matches fact",
    });

    const testConfig = {
      ...mockConfig,
      test: {
        facts: ["Hello World Test", "Test content"],
      } as PromptTest,
    };

    const result = await evaluateTestResult(testConfig, mockResult);
    assert.equal(result, undefined);
  });

  test("should fail on first inconsistent fact", async () => {
    // Mock classify function to return consistent first, then inconsistent
    vi.mocked(classify)
      .mockResolvedValueOnce({
        label: "consistent",
        answer: "First fact matches",
      })
      .mockResolvedValueOnce({
        label: "inconsistent",
        answer: "Second fact does not match",
      });

    const testConfig = {
      ...mockConfig,
      test: {
        facts: ["Hello World Test", "Completely different fact"],
      } as PromptTest,
    };

    const result = await evaluateTestResult(testConfig, mockResult);
    assert.equal(result, "fact assertion failed: output is not factually consistent with 'Completely different fact'");
  });

  test("should use classify function for fact evaluation", async () => {
    // Mock classify function to always return consistent
    vi.mocked(classify).mockResolvedValue({
      label: "consistent",
      answer: "Fact is consistent",
    });

    const testConfig = {
      ...mockConfig,
      test: {
        facts: ["Some complex fact that would normally fail"],
      } as PromptTest,
    };

    const result = await evaluateTestResult(testConfig, mockResult);
    assert.equal(result, undefined); // Should pass with mock function
  });

  test("should handle classify function errors", async () => {
    // Mock classify function to throw an error
    vi.mocked(classify).mockRejectedValue(new Error("LLM service unavailable"));

    const testConfig = {
      ...mockConfig,
      test: {
        facts: ["Some fact"],
      } as PromptTest,
    };

    const result = await evaluateTestResult(testConfig, mockResult);
    assert.equal(result, "fact evaluation error: LLM service unavailable");
  });

});
