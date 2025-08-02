// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, test, assert, beforeEach, vi } from "vitest";
import { detectContextWindow } from "../src/contextwindow.js";

// Mock the context and dependencies
const mockCache = {
  get: vi.fn(),
  set: vi.fn(),
  values: vi.fn(),
  getSha: vi.fn(),
  getOrUpdate: vi.fn(),
  name: "context-windows"
};

const mockHost = {
  cache: vi.fn().mockResolvedValue(mockCache)
};

const mockRunPrompt = vi.fn();

const mockContext = {
  host: mockHost,
  runPrompt: mockRunPrompt
};

// Mock the resolveChatGenerationContext function
vi.mock("@genaiscript/core", () => ({
  genaiscriptDebug: vi.fn(() => vi.fn()),
  resolveChatGenerationContext: vi.fn().mockResolvedValue(mockContext)
}));

beforeEach(() => {
  // Clear all mocks
  vi.clearAllMocks();
});

describe("detectContextWindow", () => {
  test("returns cached result when available", async () => {
    const cachedValue = 32000;
    mockCache.get.mockResolvedValue(cachedValue);
    
    const result = await detectContextWindow("test:model");
    
    assert.strictEqual(result.contextWindow, cachedValue);
    assert.strictEqual(result.cached, true);
    assert.strictEqual(result.method, "cache");
    assert.ok(!result.error);
    
    // Verify cache was checked
    assert.ok(mockCache.get.calledWith("test:model"));
  });

  test("massive payload strategy parses error message correctly", async () => {
    mockCache.get.mockResolvedValue(undefined); // No cached value
    
    // Mock runPrompt that returns an error with context window info
    mockRunPrompt.mockResolvedValue({
      error: {
        message: "Max size: 16000 tokens."
      }
    });
    
    const result = await detectContextWindow("test:model", {
      useBinarySearch: false // Only use massive payload strategy
    });
    
    assert.strictEqual(result.contextWindow, 16000);
    assert.strictEqual(result.method, "massive_payload");
    assert.ok(!result.error);
    
    // Verify result was cached
    assert.ok(mockCache.set.calledWith("test:model", 16000));
  });

  test("handles different error message patterns", async () => {
    mockCache.get.mockResolvedValue(undefined);
    
    const testCases = [
      {
        message: "maximum context length is 8000",
        expected: 8000
      },
      {
        message: "context length of 5000 exceeds limit of 4096",
        expected: 4096
      },
      {
        message: "input tokens (10000) exceeds maximum allowed (8192)",
        expected: 8192
      }
    ];
    
    for (const testCase of testCases) {
      mockRunPrompt.mockResolvedValue({
        error: {
          message: testCase.message
        }
      });
      
      const result = await detectContextWindow(`test:model:${testCase.expected}`, {
        useBinarySearch: false
      });
      
      assert.strictEqual(result.contextWindow, testCase.expected);
      assert.strictEqual(result.method, "massive_payload");
    }
  });

  test("successful massive payload returns conservative estimate", async () => {
    mockCache.get.mockResolvedValue(undefined);
    
    // Mock successful runPrompt response (no error)
    mockRunPrompt.mockResolvedValue({
      text: "There are 64000 smileys"
    });
    
    const result = await detectContextWindow("test:model", {
      testPayloadSize: 64000,
      useBinarySearch: false
    });
    
    // Should return conservative estimate (75% of payload size)
    assert.strictEqual(result.contextWindow, 48000);
    assert.strictEqual(result.method, "massive_payload");
    assert.ok(!result.error);
  });

  test("handles cache errors gracefully", async () => {
    mockCache.get.mockRejectedValue(new Error("Cache error"));
    
    const result = await detectContextWindow("test:model");
    
    assert.strictEqual(result.contextWindow, 0);
    assert.strictEqual(result.method, "error");
    assert.ok(result.error?.includes("Cache error"));
  });

  test("respects custom options", async () => {
    mockCache.get.mockResolvedValue(undefined);
    
    const customOptions = {
      maxContextWindow: 128000,
      testPayloadSize: 32000,
      useBinarySearch: false,
      cacheName: "custom-cache"
    };
    
    mockRunPrompt.mockResolvedValue({
      error: {
        message: "Max size: 64000 tokens."
      }
    });
    
    const result = await detectContextWindow("test:model", customOptions);
    
    // Verify custom cache name was used
    assert.ok(mockHost.cache.calledWith("custom-cache"));
    
    assert.strictEqual(result.contextWindow, 64000);
    assert.strictEqual(result.method, "massive_payload");
  });

  test("binary search strategy works correctly", async () => {
    mockCache.get.mockResolvedValue(undefined);
    
    // Mock massive payload failure
    mockRunPrompt
      .mockResolvedValueOnce({
        error: { message: "Could not parse context" }
      })
      // Then mock binary search responses - first few succeed, then fail
      .mockResolvedValueOnce({ text: "success" }) // mid = 128500, success
      .mockResolvedValueOnce({ text: "success" }) // mid = 192250, success  
      .mockResolvedValueOnce({ error: { message: "too big" } }) // mid = 224375, fail
      .mockResolvedValueOnce({ text: "success" }) // mid = 208312, success
      .mockResolvedValueOnce({ error: { message: "too big" } }); // mid = 216343, fail
    
    const result = await detectContextWindow("test:model", {
      maxContextWindow: 256000,
      useBinarySearch: true
    });
    
    assert.ok(result.contextWindow > 0);
    assert.strictEqual(result.method, "binary_search");
    assert.ok(!result.error);
  });
});