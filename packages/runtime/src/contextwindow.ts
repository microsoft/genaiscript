// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * Context window detection utilities for determining available token limits for specific models
 */

import type {
  WorkspaceFileCache,
  ChatGenerationContextOptions,
  ChatGenerationContext,
} from "@genaiscript/core";
import { genaiscriptDebug, resolveChatGenerationContext } from "@genaiscript/core";

const debug = genaiscriptDebug("runtime:context");

/**
 * Result of context window detection
 */
export interface ContextWindowResult {
  /** The detected context window size in tokens */
  promptTokens: number;
  /** Whether this result was retrieved from cache */
  cached?: boolean;
  /** Error message if detection failed */
  error?: string;
}

/**
 * Options for context window detection
 */
export interface ContextWindowDetectionOptions extends ChatGenerationContextOptions {
  /** Maximum context window to test (defaults to 256000) */
  maxContextWindow?: number;
  /** Test payload size (defaults to 64000 characters) */
  testPayloadSize?: number;
  /** Cache name (defaults to "context-windows") */
  cacheName?: string;
}

/**
 * Detects the available context window size for a specific model
 *
 * @param modelId - The model identifier (e.g., "github:gpt-4o", "openai:gpt-4")
 * @param options - Configuration options
 * @returns Promise resolving to context window detection result
 */
export async function detectContextWindow(
  modelId: string,
  options?: ContextWindowDetectionOptions,
): Promise<ContextWindowResult> {
  const {
    maxContextWindow = 256000,
    testPayloadSize = 1 << 22, // 4M
    cacheName = "context-windows",
    ...rest
  } = options || {};

  debug(`detecting context window for model ${modelId}`);

  // Get global runtime context for both context generation and workspace access
  const ctx = resolveChatGenerationContext({ ...rest });

  try {
    // Get cache instance from global runtime context
    const cache: WorkspaceFileCache<string, number> = await workspace.cache(cacheName);

    // Check cache first
    const cachedResult = await cache.get(modelId);
    if (cachedResult) {
      debug(`context window for ${modelId} found in cache: ${cachedResult}`);
      return {
        promptTokens: cachedResult,
        cached: true,
      };
    }

    // Try massive payload strategy first
    let result = await tryMassivePayloadStrategy(ctx, modelId, testPayloadSize, maxContextWindow);

    if (result?.promptTokens > 0) {
      // Cache the successful result
      await cache.set(modelId, result.promptTokens);
      debug(`cached context window for ${modelId}: ${result.promptTokens}`);
      return result;
    }

    // Fallback to binary search if enabled and massive payload failed
    result = await tryBinarySearchStrategy(ctx, modelId, maxContextWindow);

    if (result.promptTokens > 0) {
      // Cache the successful result
      await cache.set(modelId, result.promptTokens);
      debug(`cached context window for ${modelId}: ${result.promptTokens}`);
      return result;
    }

    // Both strategies failed
    return {
      promptTokens: 0,
      error: "Failed to detect context window with available strategies",
    };
  } catch (error) {
    debug(`error detecting context window for ${modelId}: ${error}`);
    return {
      promptTokens: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Strategy that sends a massive payload and parses error messages to detect context window limits
 */
async function tryMassivePayloadStrategy(
  ctx: ChatGenerationContext,
  modelId: string,
  testPayloadSize: number,
  maxTokens: number,
): Promise<ContextWindowResult> {
  debug(`trying massive payload strategy (${testPayloadSize} chars) for ${modelId}`);

  try {
    // Create a large test payload (using emoji as it's consistent token-wise)
    const testText = "😊".repeat(testPayloadSize);

    // Attempt to send the large payload using the context
    const result = await ctx.runPrompt(
      async (_: ChatGenerationContext) => {
        _.$`Count the number of smileys: ${testText}`;
      },
      {
        system: [],
        maxTokens,
        model: modelId,
        label: `detect context window of ${modelId}`,
        retries: 0,
      },
    );

    // If it succeeded, we haven't hit the limit yet
    // Return a conservative estimate
    if (!result.error) {
      return undefined;
    }

    // Parse error message for context window information
    const errorMessage = result.error.message;
    debug(`error message: ${errorMessage}`);

    // Common patterns for context window errors
    const patterns = [
      /Max\s+size:\s*(?<maxSize>\d+)\s*tokens/i,
      /maximum\s+context\s+length\s+is\s+(?<maxSize>\d+)/i,
      /context\s+length\s+of\s+\d+\s+exceeds\s+limit\s+of\s+(?<maxSize>\d+)/i,
      /input\s+tokens\s+\(\d+\)\s+exceeds\s+maximum\s+allowed\s+\((?<maxSize>\d+)\)/i,
    ];

    for (const pattern of patterns) {
      const match = pattern.exec(errorMessage);
      if (match?.groups?.maxSize) {
        const contextWindow = parseInt(match.groups.maxSize, 10);
        if (contextWindow > 0) {
          debug(`detected context window from error: ${contextWindow}`);
          return {
            promptTokens: contextWindow,
          };
        }
      }
    }

    return {
      promptTokens: 0,
      error: `Could not parse context window from error: ${errorMessage}`,
    };
  } catch (error) {
    debug(`massive payload strategy failed: ${error}`);
    return {
      promptTokens: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Binary search strategy to find the exact context window limit
 */
async function tryBinarySearchStrategy(
  ctx: ChatGenerationContext,
  modelId: string,
  maxContextWindow: number,
): Promise<ContextWindowResult> {
  debug(`trying binary search strategy for ${modelId}`);

  let low = 4000; // Start with a reasonable minimum
  let high = maxContextWindow;
  let lastSuccessful = 0;
  let keepIterating = 6;

  try {
    while (low <= high && keepIterating-- > 0 && high - low > 1000) {
      const mid = Math.floor((low + high) / 2);
      debug(`testing context window size: ${mid}`);

      // Create a payload that should consume approximately 'mid' tokens
      // Using roughly 4 characters per token as a heuristic
      const testText = "test ".repeat(Math.floor(mid / 4));

      const result = await ctx.runPrompt(
        async (_: ChatGenerationContext) => {
          _.$`Process this text: ${testText}`;
        },
        {
          system: [],
          maxTokens: 100, // Small response to minimize cost
          model: modelId,
          label: `detect context window of ${modelId} - ${mid}t`,
          retries: 0,
        },
      );

      if (result.error) {
        // If it failed, the context window is smaller
        high = mid - 1;
      } else {
        // If it succeeded, we can go higher
        lastSuccessful = mid;
        low = mid + 1;
      }
    }

    if (lastSuccessful > 0) {
      debug(`binary search found context window: ${lastSuccessful}`);
      return {
        promptTokens: lastSuccessful,
      };
    }

    return {
      promptTokens: 0,
      error: "Binary search failed to find working context window",
    };
  } catch (error) {
    debug(`binary search strategy failed: ${error}`);
    return {
      promptTokens: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
