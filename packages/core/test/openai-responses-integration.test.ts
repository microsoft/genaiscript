import { describe, test, expect, beforeEach } from "vitest";
import { resolveLanguageModel } from "../src/lm.js";
import { MODEL_PROVIDER_OPENAI } from "../src/constants.js";
import { OpenAIResponsesAPIChatCompletion } from "../src/openai.js";
import { TestHost } from "../src/testhost.js";
import type { LanguageModelConfiguration } from "../src/server/messages.js";

describe("OpenAI Responses API Integration", () => {
  beforeEach(() => {
    TestHost.install();
  });

  test("should handle openai_responses configuration type", () => {
    const cfg: LanguageModelConfiguration = {
      type: "openai_responses",
      base: "https://api.openai.com/v1",
      token: "test-token",
      model: "gpt-4o-mini",
      provider: MODEL_PROVIDER_OPENAI
    };
    
    // Should not throw TypeScript errors
    expect(cfg.type).toBe("openai_responses");
    expect(cfg.provider).toBe(MODEL_PROVIDER_OPENAI);
  });

  test("should resolve to OpenAI model with Responses API handler", () => {
    const model = resolveLanguageModel(MODEL_PROVIDER_OPENAI);
    
    // Verify the model uses the Responses API handler
    expect(model.completer).toBe(OpenAIResponsesAPIChatCompletion);
    expect(model.id).toBe(MODEL_PROVIDER_OPENAI);
  });
});