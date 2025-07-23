import { describe, test, expect, vi } from "vitest";
import type { ChatCompletionResponse } from "../src/chattypes.js";
import { OpenAIResponsesCompletion } from "../src/openai.js";

// Mock the required dependencies
vi.mock("../src/features.js", () => ({
  providerFeatures: vi.fn().mockReturnValue({ openaiapitype: "responses" }),
}));

vi.mock("../src/models.js", () => ({
  parseModelIdentifier: vi.fn().mockReturnValue({
    provider: "openai",
    model: "gpt-4",
    family: "gpt-4",
    reasoningEffort: undefined,
  }),
}));

vi.mock("../src/encoders.js", () => ({
  resolveTokenEncoder: vi.fn().mockResolvedValue({
    encode: vi.fn().mockReturnValue([1, 2, 3]),
  }),
}));

vi.mock("../src/fetch.js", () => ({
  createFetch: vi.fn().mockResolvedValue(vi.fn()),
}));

describe("OpenAI Responses API Handler", () => {
  test("should be a function", () => {
    expect(typeof OpenAIResponsesCompletion).toBe("function");
    expect(OpenAIResponsesCompletion.name).toBe("OpenAIResponsesCompletion");
  });

  test("should have correct function signature", () => {
    expect(OpenAIResponsesCompletion.length).toBe(4); // req, cfg, options, trace
  });
});