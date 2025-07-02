import type {
  ChatGenerationContext,
  ChatGenerationContextOptions,
  RuntimePromptContext,
} from "./types.js";

export function resolveChatGenerationContext(
  options?: ChatGenerationContextOptions,
): ChatGenerationContext {
  const { generator: ctx } = options || {};
  if (ctx) return ctx;
  const globalPromptContext: RuntimePromptContext = globalThis as unknown as RuntimePromptContext;
  const generator = globalPromptContext.env?.generator;
  if (!generator)
    throw new Error("You must pass a chat generation context when using the runtime.");
  return generator;
}
