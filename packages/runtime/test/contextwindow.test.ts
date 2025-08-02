// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, test, assert, beforeEach, vi } from "vitest";
import { detectContextWindow } from "../src/contextwindow.js";

// Mock the global context that would be available in the runtime
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

const mockPrompt = vi.fn();

// Mock globals
const originalGlobal = global as any;
beforeEach(() => {
  // Clear all mocks
  vi.clearAllMocks();
  
  // Set up global mocks
  originalGlobal.host = mockHost;
  originalGlobal.prompt = mockPrompt;
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

  test("returns error when host is not available", async () => {
    originalGlobal.host = undefined;
    
    const result = await detectContextWindow("test:model");
    
    assert.strictEqual(result.contextWindow, 0);
    assert.strictEqual(result.method, "error");
    assert.ok(result.error?.includes("Host not available"));
  });

  test("massive payload strategy parses error message correctly", async () => {
    mockCache.get.mockResolvedValue(undefined); // No cached value
    
    // Mock prompt that returns an error with context window info
    const mockPromptResult = vi.fn().mockResolvedValue({
      error: {
        message: "Max size: 16000 tokens."
      }
    });
    
    // Set up prompt mock with options method
    const promptWithOptions = vi.fn().mockReturnValue({
      options: mockPromptResult
    });
    
    originalGlobal.prompt = promptWithOptions;
    
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
      const mockPromptResult = vi.fn().mockResolvedValue({
        error: {
          message: testCase.message
        }
      });
      
      const promptWithOptions = vi.fn().mockReturnValue({
        options: mockPromptResult
      });
      
      originalGlobal.prompt = promptWithOptions;
      
      const result = await detectContextWindow(`test:model:${testCase.expected}`, {
        useBinarySearch: false
      });
      
      assert.strictEqual(result.contextWindow, testCase.expected);
      assert.strictEqual(result.method, "massive_payload");
    }
  });

  test("successful massive payload returns conservative estimate", async () => {
    mockCache.get.mockResolvedValue(undefined);
    
    // Mock successful prompt response (no error)
    const mockPromptResult = vi.fn().mockResolvedValue({
      text: "There are 64000 smileys"
    });
    
    const promptWithOptions = vi.fn().mockReturnValue({
      options: mockPromptResult
    });
    
    originalGlobal.prompt = promptWithOptions;
    
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
    
    const mockPromptResult = vi.fn().mockResolvedValue({
      error: {
        message: "Max size: 64000 tokens."
      }
    });
    
    const promptWithOptions = vi.fn().mockReturnValue({
      options: mockPromptResult
    });
    
    originalGlobal.prompt = promptWithOptions;
    
    const result = await detectContextWindow("test:model", customOptions);
    
    // Verify custom cache name was used
    assert.ok(mockHost.cache.calledWith("custom-cache"));
    
    assert.strictEqual(result.contextWindow, 64000);
    assert.strictEqual(result.method, "massive_payload");
  });
});