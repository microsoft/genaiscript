// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, test, expect, vi } from "vitest";
import type { LanguageModelConfiguration } from "../src/server/messages.js";

// Mock the OpenAI v1 and v2 implementations
const mockOpenAIv1ChatCompletion = vi.fn().mockResolvedValue({ text: "v1 response" });
const mockOpenAIv2ResponsesChatCompletion = vi.fn().mockResolvedValue({ text: "v2 responses" });

vi.mock("../src/openai-chatcompletion.js", () => ({
  OpenAIv1ChatCompletion: mockOpenAIv1ChatCompletion,
}));

vi.mock("../src/openai-responses.js", () => ({
  OpenAIv2ResponsesChatCompletion: mockOpenAIv2ResponsesChatCompletion,
}));

describe("OpenAI Responses API Type", () => {
  test("should use OpenAIv2ResponsesChatCompletion when type is 'responses'", async () => {
    // Clear mocks
    vi.clearAllMocks();

    // Import after mocking
    const { OpenAIChatCompletion } = await import("../src/openai.js");

    const req = {
      model: "gpt-4",
      messages: [{ role: "user" as const, content: "Hello" }],
    };

    const cfg: LanguageModelConfiguration = {
      provider: "openai",
      model: "gpt-4",
      base: "https://api.openai.com/v1",
      token: "test-token",
      type: "responses",
    };

    const options = { requestOptions: {} };
    const trace = undefined;

    const result = await OpenAIChatCompletion(req, cfg, options, trace);

    // Verify that the v2 responses handler was called
    expect(mockOpenAIv2ResponsesChatCompletion).toHaveBeenCalledWith(req, cfg, options, trace);
    expect(mockOpenAIv1ChatCompletion).not.toHaveBeenCalled();
    expect(result.text).toBe("v2 responses");
  });

  test("should use OpenAIv1ChatCompletion when type is not 'responses'", async () => {
    // Clear mocks
    vi.clearAllMocks();

    // Import after mocking
    const { OpenAIChatCompletion } = await import("../src/openai.js");

    const req = {
      model: "gpt-4",
      messages: [{ role: "user" as const, content: "Hello" }],
    };

    const cfg: LanguageModelConfiguration = {
      provider: "openai",
      model: "gpt-4",
      base: "https://api.openai.com/v1",
      token: "test-token",
      type: "openai",
    };

    const options = { requestOptions: {} };
    const trace = undefined;

    const result = await OpenAIChatCompletion(req, cfg, options, trace);

    // Verify that the v1 handler was called
    expect(mockOpenAIv1ChatCompletion).toHaveBeenCalledWith(req, cfg, options, trace);
    expect(mockOpenAIv2ResponsesChatCompletion).not.toHaveBeenCalled();
    expect(result.text).toBe("v1 response");
  });

  test("should use OpenAIv1ChatCompletion when type is undefined", async () => {
    // Clear mocks
    vi.clearAllMocks();

    // Import after mocking
    const { OpenAIChatCompletion } = await import("../src/openai.js");

    const req = {
      model: "gpt-4",
      messages: [{ role: "user" as const, content: "Hello" }],
    };

    const cfg: LanguageModelConfiguration = {
      provider: "openai",
      model: "gpt-4",
      base: "https://api.openai.com/v1",
      token: "test-token",
      // type is undefined
    };

    const options = { requestOptions: {} };
    const trace = undefined;

    const result = await OpenAIChatCompletion(req, cfg, options, trace);

    // Verify that the v1 handler was called (default behavior)
    expect(mockOpenAIv1ChatCompletion).toHaveBeenCalledWith(req, cfg, options, trace);
    expect(mockOpenAIv2ResponsesChatCompletion).not.toHaveBeenCalled();
    expect(result.text).toBe("v1 response");
  });
});