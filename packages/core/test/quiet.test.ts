// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { describe, test, expect, beforeEach, afterEach, vi } from "vitest";
import { isQuiet, setQuiet } from "../src/quiet.js";
import { createChatTurnGenerationContext } from "../src/runpromptcontext.js";
import type { GenerationOptions } from "../src/generation.js";
import type { MarkdownTrace } from "../src/trace.js";
import { CancellationToken } from "../src/cancellation.js";

// Mock the stdio module
vi.mock("../src/stdio.js", () => ({
  stdout: {
    write: vi.fn(),
  },
  stderr: {
    write: vi.fn(),
  },
}));

describe("quiet mode", () => {
  let originalQuiet: boolean;
  let mockTrace: MarkdownTrace;

  beforeEach(() => {
    originalQuiet = isQuiet;
    mockTrace = {
      log: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    } as any;
    vi.clearAllMocks();
  });

  afterEach(() => {
    setQuiet(originalQuiet);
  });

  test("setQuiet updates isQuiet flag", () => {
    setQuiet(true);
    expect(isQuiet).toBe(true);
    
    setQuiet(false);
    expect(isQuiet).toBe(false);
  });

  test("isQuiet defaults to false", () => {
    setQuiet(false);
    expect(isQuiet).toBe(false);
  });

  test("console.log respects quiet mode", async () => {
    const { stdout } = await import("../src/stdio.js");

    const options: GenerationOptions = {
      inner: false,
      stats: {} as any,
      userState: {},
    };
    
    const cancellationToken: CancellationToken = {
      isCancellationRequested: false,
    } as any;

    // Test in non-quiet mode
    setQuiet(false);
    const ctx = createChatTurnGenerationContext(options, mockTrace, cancellationToken);
    ctx.console.log("test message");
    
    expect(stdout.write).toHaveBeenCalledWith("test message\n");
    
    // Clear mocks
    vi.clearAllMocks();
    
    // Test in quiet mode
    setQuiet(true);
    const quietCtx = createChatTurnGenerationContext(options, mockTrace, cancellationToken);
    quietCtx.console.log("test message in quiet mode");
    
    // In quiet mode, stdout.write should not be called
    expect(stdout.write).not.toHaveBeenCalled();
    // But trace should still be called
    expect(mockTrace.log).toHaveBeenCalledWith("test message in quiet mode");
  });
});