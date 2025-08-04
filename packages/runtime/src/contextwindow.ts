// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * Context window detection utilities for determining available token limits for specific models
 */

import type {
  WorkspaceFileCache,
  ChatGenerationContextOptions,
  ChatGenerationContext,
  ElementOrArray,
  LanguageModelReference,
} from "@genaiscript/core";
import { arrayify, genaiscriptDebug, resolveChatGenerationContext } from "@genaiscript/core";

const debug = genaiscriptDebug("runtime:context");

/**
 * Result of context window detection (internal interface)
 */
interface ContextWindowResult {
  /** The detected context window size in tokens */
  promptTokens?: number;
  /** Error message if detection failed */
  error?: string;
}

/**
 * Options for context window detection
 */
export interface ContextWindowDetectionOptions extends ChatGenerationContextOptions {
  /** Maximum context window to test (defaults to 4M) */
  maxContextWindow?: number;
  /** Cache name (defaults to "context-windows") */
  cacheName?: string;
  /**
   * Additional patterns to parse error message. Must expose a `maxSize` group capture.
   */
  patterns?: ElementOrArray<RegExp>;
}

/**
 * Detects the available context window size for a specific model
 *
 * @param modelId - The model identifier (e.g., "github:gpt-4o", "openai:gpt-4")
 * @param options - Configuration options
 * @returns Promise resolving to the context window size in tokens, or -1 if detection fails
 */
export async function detectContextWindow(
  model: string,
  options?: ContextWindowDetectionOptions,
): Promise<ContextWindowResult> {
  const {
    maxContextWindow = 1 << 22, // 4M
    cacheName = "context-windows",
    ...rest
  } = options || {};

  debug(`detecting context window for model %s`, model);

  // Get global runtime context for both context generation and workspace access
  const ctx = resolveChatGenerationContext({ ...rest });

  // Get cache instance from global runtime context
  const cache: WorkspaceFileCache<LanguageModelReference, ContextWindowResult> =
    await workspace.cache(cacheName);

  const modelRef = await host.resolveLanguageModel(model);

  // Check cache first
  const cachedResult = await cache.get(modelRef);
  if (cachedResult !== undefined) {
    debug(`context window for %s found in cache: %O`, modelRef, cachedResult);
    return cachedResult;
  }

  // Create a large test payload (using emoji as it's consistent token-wise)
  const testText = "😊".repeat(maxContextWindow);

  // Attempt to send the large payload using the context
  const result = await ctx.runPrompt(
    async (_: ChatGenerationContext) => {
      _.$`Count the number of smileys: ${testText}`;
    },
    {
      system: [],
      maxTokens: 10,
      model: modelRef.modelId,
      label: `detect context window of ${modelRef.modelId}`,
      retries: 0,
      retryOn: [],
    },
  );

  // If it succeeded, we haven't hit the limit yet
  // Return a conservative estimate
  if (!result.error) throw new Error("context window too small!");

  // Parse error message for context window information
  const errorMessage = result.error.message;
  debug(`error message: ${errorMessage}`);

  // Common patterns for context window errors
  const patterns = [
    /Max\s+size:\s*(?<maxSize>\d+)\s*tokens/i,
    /maximum\s+context\s+length\s+is\s+(?<maxSize>\d+)/i,
    /context\s+length\s+of\s+\d+\s+exceeds\s+limit\s+of\s+(?<maxSize>\d+)/i,
    /input\s+tokens\s+\(\d+\)\s+exceeds\s+maximum\s+allowed\s+\((?<maxSize>\d+)\)/i,
    /Limit\s+(?<maxSize>\d+),\s+Requested\s+\d+/i,
    ...arrayify(options?.patterns),
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(errorMessage);
    if (match?.groups?.maxSize) {
      const promptTokens = parseInt(match.groups.maxSize, 10);
      if (promptTokens > 0) {
        debug(`detected context window from error: ${promptTokens}`);
        const res: ContextWindowResult = { promptTokens };
        await cache.set(modelRef, res);
        return res;
      }
    }
  }

  const resError = {
    promptTokens: -1,
    error: `Could not parse context window from error: ${errorMessage}`,
  } satisfies ContextWindowResult;
  await cache.set(modelRef, resError);
  return resError;
}
