import { describe, test, expect } from "vitest";
import { providerFeatures } from "../src/features.js";
import { LocalOpenAICompatibleModel } from "../src/openai.js";

describe("OpenAI Responses API", () => {
  test("OpenAI provider should default to responses API", () => {
    const features = providerFeatures("openai");
    expect(features?.openaiapitype).toBe("responses");
    expect(features?.responseType).toBe("json_schema");
  });

  test("LocalOpenAICompatibleModel should use responses handler for OpenAI", () => {
    const model = LocalOpenAICompatibleModel("openai", {
      listModels: true,
      transcribe: true,
      speech: true,
      imageGeneration: true,
    });

    expect(model.completer).toBeDefined();
    expect(model.completer.name).toBe("OpenAIResponsesCompletion");
  });

  test("LocalOpenAICompatibleModel should use chat handler for other providers", () => {
    const model = LocalOpenAICompatibleModel("anthropic", {
      listModels: true,
    });

    expect(model.completer).toBeDefined();
    expect(model.completer.name).toBe("OpenAIChatCompletion");
  });

  test("provider features should include openaiapitype option", () => {
    const features = providerFeatures("openai");
    expect(features).toHaveProperty("openaiapitype");
    expect(["chat", "responses"]).toContain(features?.openaiapitype);
  });
});