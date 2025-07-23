import { describe, test, expect, beforeEach } from "vitest";
import { resolveLanguageModel } from "../src/lm.js";
import { MODEL_PROVIDER_OPENAI } from "../src/constants.js";
import { OpenAIResponsesAPIChatCompletion } from "../src/openai.js";
import { TestHost } from "../src/testhost.js";

describe("OpenAI Responses API", () => {
  beforeEach(() => {
    TestHost.install();
  });

  test("should resolve OpenAI provider to use Responses API", () => {
    const model = resolveLanguageModel(MODEL_PROVIDER_OPENAI);
    expect(model).toBeDefined();
    expect(model.id).toBe(MODEL_PROVIDER_OPENAI);
    expect(model.completer).toBe(OpenAIResponsesAPIChatCompletion);
  });

  test("should have all expected capabilities", () => {
    const model = resolveLanguageModel(MODEL_PROVIDER_OPENAI);
    expect(model.listModels).toBeDefined();
    expect(model.transcriber).toBeDefined();
    expect(model.speaker).toBeDefined();
    expect(model.imageGenerator).toBeDefined();
    expect(model.embedder).toBeDefined();
  });
});