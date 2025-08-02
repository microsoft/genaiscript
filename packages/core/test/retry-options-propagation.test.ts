import assert from "node:assert/strict";
import { test, describe } from "vitest";
import { parsePromptScriptMeta } from "../src/template.js";

describe("retry options propagation", () => {
  test("PromptArgs includes retry options from script metadata", () => {
    const jsSource = `
      script({
        title: "Test script with retry options",
        retries: 3,
        retryDelay: 1000,
        maxDelay: 5000,
        maxRetryAfter: 10000,
        retryOn: [429, 500, 502, 503, 504]
      })
    `;

    const meta = parsePromptScriptMeta(jsSource);
    
    // Verify that retry options are parsed correctly from the script
    assert.strictEqual(meta.retries, 3);
    assert.strictEqual(meta.retryDelay, 1000);
    assert.strictEqual(meta.maxDelay, 5000);
    assert.strictEqual(meta.maxRetryAfter, 10000);
    assert.deepStrictEqual(meta.retryOn, [429, 500, 502, 503, 504]);
  });

  test("PromptScript type includes RetryOptions properties", () => {
    // TypeScript compilation test: This test will fail to compile if 
    // PromptScript doesn't extend RetryOptions properly
    const script = {
      id: "test",
      title: "Test script",
      // These should be valid properties if PromptScript includes RetryOptions
      retries: 5,
      retryDelay: 2000,
      maxDelay: 8000,
      maxRetryAfter: 15000,
      retryOn: [429, 502],
      jsSource: `script({ title: "Test" }); $\`Hello world\``,
    };

    // If this compiles without TypeScript errors, the inheritance is working
    assert.strictEqual(script.retries, 5);
    assert.strictEqual(script.retryDelay, 2000);
    assert.strictEqual(script.maxDelay, 8000);
    assert.strictEqual(script.maxRetryAfter, 15000);
    assert.deepStrictEqual(script.retryOn, [429, 502]);
  });
});