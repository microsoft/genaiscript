// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, test, expect, vi } from "vitest";
import { OpenAIResponsesChatCompletion } from "../src/openai-responses.js";
import type { CreateChatCompletionRequest } from "../src/chattypes.js";
import type { LanguageModelConfiguration } from "../src/server/messages.js";

// Mock dependencies
vi.mock("openai", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      responses: {
        create: vi.fn(),
      },
    })),
  };
});

vi.mock("../src/fetch.js", () => ({
  createFetch: vi.fn().mockResolvedValue(global.fetch),
}));

vi.mock("../src/util.js", () => ({
  logError: vi.fn(),
}));

describe("OpenAIResponsesChatCompletion", () => {
  const mockConfig: LanguageModelConfiguration = {
    provider: "openai",
    model: "gpt-3.5-turbo",
    base: "https://api.openai.com/v1",
    token: "test-token",
  };

  const mockRequest: CreateChatCompletionRequest = {
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "user",
        content: "Hello, world!",
      },
    ],
    temperature: 0.7,
    max_completion_tokens: 100,
    stream: false,
  };

  const mockTrace = {
    detailsFenced: vi.fn(),
    appendContent: vi.fn(),
    error: vi.fn(),
  };

  test("should handle non-streaming response", async () => {
    const mockOpenAI = {
      responses: {
        create: vi.fn().mockResolvedValue({
          choices: [
            {
              message: {
                content: "Hello! How can I help you?",
              },
              finish_reason: "stop",
            },
          ],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 20,
            total_tokens: 30,
          },
          model: "gpt-3.5-turbo",
        }),
      },
    };

    // Mock the OpenAI constructor
    const OpenAI = await import("openai");
    vi.mocked(OpenAI.default).mockImplementation(() => mockOpenAI as any);

    const result = await OpenAIResponsesChatCompletion(
      mockRequest,
      mockConfig,
      { requestOptions: {} },
      mockTrace as any
    );

    expect(result).toEqual({
      text: "Hello! How can I help you?",
      toolCalls: [],
      finishReason: "stop",
      usage: {
        prompt_tokens: 10,
        completion_tokens: 20,
        total_tokens: 30,
      },
      model: "gpt-3.5-turbo",
    });

    expect(mockOpenAI.responses.create).toHaveBeenCalledWith({
      model: "gpt-3.5-turbo",
      messages: mockRequest.messages,
      temperature: 0.7,
      max_output_tokens: 100,
      stream: false,
    });
  });

  test("should handle errors properly", async () => {
    const mockOpenAI = {
      responses: {
        create: vi.fn().mockRejectedValue(new Error("API Error")),
      },
    };

    const OpenAI = await import("openai");
    vi.mocked(OpenAI.default).mockImplementation(() => mockOpenAI as any);

    const result = await OpenAIResponsesChatCompletion(
      mockRequest,
      mockConfig,
      { requestOptions: {} },
      mockTrace as any
    );

    expect(result.finishReason).toBe("fail");
    expect(result.error).toBeDefined();
    expect(result.error?.message).toBe("API Error");
  });

  test("should handle cancellation", async () => {
    const mockCancellationToken = {
      isCancellationRequested: true,
    };

    const result = await OpenAIResponsesChatCompletion(
      mockRequest,
      mockConfig,
      { requestOptions: {}, cancellationToken: mockCancellationToken },
      mockTrace as any
    );

    expect(result.finishReason).toBe("cancel");
  });

  test("should handle streaming response", async () => {
    const mockChunks = [
      {
        choices: [
          {
            delta: { content: "Hello" },
            finish_reason: null,
          },
        ],
        model: "gpt-3.5-turbo",
      },
      {
        choices: [
          {
            delta: { content: "!" },
            finish_reason: "stop",
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
      },
    ];

    const mockStream = {
      [Symbol.asyncIterator]: async function* () {
        for (const chunk of mockChunks) {
          yield chunk;
        }
      },
    };

    const mockOpenAI = {
      responses: {
        create: vi.fn().mockResolvedValue(mockStream),
      },
    };

    const OpenAI = await import("openai");
    vi.mocked(OpenAI.default).mockImplementation(() => mockOpenAI as any);

    const mockPartialCb = vi.fn();
    const streamingRequest = { ...mockRequest, stream: true };

    const result = await OpenAIResponsesChatCompletion(
      streamingRequest,
      mockConfig,
      { requestOptions: {}, partialCb: mockPartialCb },
      mockTrace as any
    );

    expect(result).toEqual({
      text: "Hello!",
      toolCalls: [],
      finishReason: "stop",
      usage: {
        prompt_tokens: 10,
        completion_tokens: 20,
        total_tokens: 30,
      },
      model: "gpt-3.5-turbo",
    });

    expect(mockPartialCb).toHaveBeenCalledWith({ text: "Hello" });
    expect(mockPartialCb).toHaveBeenCalledWith({ text: "Hello!" });
    expect(mockTrace.appendContent).toHaveBeenCalledWith("Hello");
    expect(mockTrace.appendContent).toHaveBeenCalledWith("!");
  });
});