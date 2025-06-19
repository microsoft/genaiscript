import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { estimateCost, isCosteable, GenerationStats } from "./usage";
import type { ChatCompletionUsage } from "./chattypes";

describe("usage", () => {
  describe("estimateCost", () => {
    test("should calculate cost correctly for known model", () => {
      const usage: ChatCompletionUsage = {
        prompt_tokens: 100,
        completion_tokens: 50,
        total_tokens: 150,
      };
      const cost = estimateCost("openai:chatgpt-4o-latest", usage);
      assert(typeof cost === "number");
      assert.strictEqual(cost, 0.00075);
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
  });
});
