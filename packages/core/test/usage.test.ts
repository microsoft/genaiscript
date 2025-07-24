// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, test, assert } from "vitest";
import { estimateCost, isCosteable, GenerationStats } from "../src/usage.js";
import type { ChatCompletionUsage } from "../src/chattypes.js";

describe("usage", () => {
  describe("estimateCost", () => {
    test("should calculate cost correctly for known model", () => {
      const usage: ChatCompletionUsage = {
        prompt_tokens: 100,
        completion_tokens: 50,
        total_tokens: 150,
      };
      for (const model of [
        "openai:chatgpt-4o-latest",
        "github:gpt-4o",
        "github:openai/gpt-4o",
        "azure:gpt-4o",
      ]) {
        console.log(model);
        const cost = estimateCost(model, usage);
        assert(typeof cost === "number");
        assert.strictEqual(cost, 0.00075);
      }
    });

    test("should match model pattern when exact model not found", () => {
      const usage: ChatCompletionUsage = {
        prompt_tokens: 100,
        completion_tokens: 50,
        total_tokens: 150,
      };
      const cost = estimateCost("openai:gpt-4-0125-preview", usage);
      assert(typeof cost === "number");
      assert(cost > 0);
    });

    test("should apply cache rebate correctly", () => {
      const usage: ChatCompletionUsage = {
        prompt_tokens: 100,
        completion_tokens: 50,
        total_tokens: 150,
        prompt_tokens_details: {
          cached_tokens: 50,
        },
      };
      const cost1 = estimateCost("openai:gpt-4", usage);

      const usageNoCaching: ChatCompletionUsage = {
        prompt_tokens: 100,
        completion_tokens: 50,
        total_tokens: 150,
      };
      const cost2 = estimateCost("openai:gpt-4", usageNoCaching);

      assert(cost1 < cost2);
    });

    test("should return undefined for unknown model", () => {
      const usage: ChatCompletionUsage = {
        prompt_tokens: 100,
        completion_tokens: 50,
        total_tokens: 150,
      };
      const cost = estimateCost("unknown:model", usage);
      assert(cost === undefined);
    });
  });

  describe("isCosteable", () => {
    test("should return true for known model provider", () => {
      assert(isCosteable("openai:gpt-4"));
    });

    test("should return false for unknown model provider", () => {
      assert(!isCosteable("unknown:model"));
    });
  });

  describe("GenerationStats", () => {
    test("should initialize properly", () => {
      const stats = new GenerationStats("openai:gpt-4", "test-label");
      assert.equal(stats.model, "openai:gpt-4");
      assert.equal(stats.label, "test-label");
      assert.equal(stats.toolCalls, 0);
      assert.equal(stats.repairs, 0);
      assert.equal(stats.turns, 0);
      assert.equal(stats.children.length, 0);
    });

    test("should create child correctly", () => {
      const parent = new GenerationStats("openai:gpt-4");
      const child = parent.createChild("openai:gpt-3.5-turbo", "child-label");

      assert.equal(parent.children.length, 1);
      assert.equal(parent.children[0], child);
      assert.equal(child.model, "openai:gpt-3.5-turbo");
      assert.equal(child.label, "child-label");
    });

    test("should accumulate usage statistics", () => {
      const parent = new GenerationStats("openai:gpt-4");
      parent.addUsage(
        {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
          duration: 1000,
        },
        1000,
      );

      const child = parent.createChild("openai:gpt-3.5-turbo");
      child.addUsage(
        {
          prompt_tokens: 200,
          completion_tokens: 100,
          total_tokens: 300,
          duration: 2000,
        },
        2000,
      );

      const accumulated = parent.accumulatedUsage();
      assert.equal(accumulated.prompt_tokens, 300);
      assert.equal(accumulated.completion_tokens, 150);
      assert.equal(accumulated.total_tokens, 450);
      assert.equal(accumulated.duration, 3000);
    });

    test("should generate GitHub report with aggregate summary", () => {
      const stats = new GenerationStats("openai:gpt-4", "main");
      stats.addUsage(
        {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
          duration: 1000,
        },
        1000,
      );

      const report = stats.toMarkdownReport();
      
      // Should contain details element
      assert(report.includes("<details>"));
      assert(report.includes("</details>"));
      
      // Should contain summary with aggregate data
      assert(report.includes("<summary>"));
      assert(report.includes("150t")); // total tokens
      
      // Should contain a table
      assert(report.includes("|"));
    });

    test("should generate GitHub report with child usage", () => {
      const parent = new GenerationStats("openai:gpt-4", "main");
      parent.addUsage(
        {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
          duration: 1000,
        },
        1000,
      );

      const child = parent.createChild("openai:gpt-3.5-turbo", "helper");
      child.addUsage(
        {
          prompt_tokens: 200,
          completion_tokens: 100,
          total_tokens: 300,
          duration: 2000,
        },
        2000,
      );

      const report = parent.toMarkdownReport();
      
      // Should contain summary with total aggregate data
      assert(report.includes("450t")); // total tokens (150 + 300)
      
      // Should contain table with individual model entries (accounting for markdown escaping)
      assert(report.includes("openai:gpt\\-4") || report.includes("openai:gpt-4"));
      assert(report.includes("openai:gpt\\-3\\.5\\-turbo") || report.includes("openai:gpt-3.5-turbo"));
      assert(report.includes("main"));
      assert(report.includes("helper"));
    });

    test("should handle empty usage stats", () => {
      const stats = new GenerationStats("openai:gpt-4");
      const report = stats.toMarkdownReport();
      
      // Should still generate valid report structure
      assert(report.includes("<details>"));
      assert(report.includes("</details>"));
      assert(report.includes("<summary>"));
      
      // Should show zero usage
      assert(report.includes("0t"));
    });

    test("should handle stats with costs available", () => {
      const stats = new GenerationStats("openai:gpt-4o", "test");
      stats.addUsage({
        prompt_tokens: 100,
        completion_tokens: 50,  
        total_tokens: 150,
        duration: 1000,
      }, 1000);

      const report = stats.toMarkdownReport();
      
      // Should contain cost information for models with known pricing
      assert(report.includes("¢") || report.includes("$"));
    });

    test("should format large token counts properly", () => {
      const stats = new GenerationStats("openai:gpt-4", "large-test");
      stats.addUsage({
        prompt_tokens: 1500000, // 1.5M tokens  
        completion_tokens: 500000, // 500k tokens
        total_tokens: 2000000, // 2M tokens
        duration: 60000, // 1 minute
      }, 60000);

      const report = stats.toMarkdownReport();
      
      // Should format large numbers with appropriate units
      assert(report.includes("Mt") || report.includes("kt"));
      assert(report.includes("1.0m") || report.includes("60.0s"));
    });
  });
});
