/**
 * This module provides functionality for estimating costs and tracking usage statistics
 * related to chat completions, including generating detailed reports and logs.
 */
import {
  ChatCompletionResponse,
  ChatCompletionUsage,
  CreateChatCompletionRequest,
} from "./chattypes.js";
import { MarkdownTrace } from "./trace.js";
import { ImageGenerationUsage } from "./chat.js";
/**
 * Estimates the cost of a chat completion based on model pricing and token usage.
 *
 * @param modelId - The identifier of the model used for chat completion.
 * @param usage - The token usage statistics, including prompt, completion, and cached tokens.
 * @returns The estimated cost, or undefined if pricing data is unavailable. The cost is calculated using input and output token prices, with a rebate applied to cached tokens. If the model's pricing data cannot be determined, the function returns undefined.
 */
export declare function estimateCost(modelId: string, usage: ChatCompletionUsage): number;
export declare function estimateImageCost(modelId: string, usage: ImageGenerationUsage): number;
/**
 * Determines if the specified model has associated pricing data by checking
 * if any pricing entries start with the provider's prefix.
 *
 * @param model - The identifier of the model to check.
 * @returns True if the model has pricing data available, otherwise false.
 */
export declare function isCosteable(model: string): boolean;
/**
 * Class to track and log generation statistics for chat completions.
 */
export declare class GenerationStats {
  readonly model: string;
  readonly label?: string;
  toolCalls: number;
  repairs: number;
  turns: number;
  readonly usage: Required<ChatCompletionUsage>;
  readonly children: GenerationStats[];
  private chatTurns;
  /**
   * Constructs a GenerationStats instance.
   *
   * @param model - The model used for chat completions.
   * @param label - Optional label for the statistics.
   */
  constructor(model: string, label?: string);
  get resolvedModel(): string;
  /**
   * Calculates the total cost based on the usage statistics.
   *
   * @returns The total cost.
   */
  cost(): number;
  /**
   * Accumulates the usage statistics from this instance and its children.
   *
   * @returns The accumulated usage statistics.
   */
  accumulatedUsage(): ChatCompletionUsage;
  /**
   * Creates a new child GenerationStats instance.
   *
   * @param model - The model used for the child chat completions.
   * @param label - Optional label for the child's statistics.
   * @returns The created child GenerationStats instance.
   */
  createChild(model: string, label?: string): GenerationStats;
  /**
   * Traces the generation statistics using a MarkdownTrace instance.
   *
   * @param trace - The MarkdownTrace instance used for tracing.
   */
  trace(trace: MarkdownTrace): void;
  /**
   * Helper method to trace individual statistics.
   *
   * @param trace - The MarkdownTrace instance used for tracing.
   */
  private traceStats;
  /**
   * Logs the generation statistics.
   */
  log(): void;
  /**
   * Helper method to log tokens with indentation.
   *
   * @param indent - The indentation used for logging.
   */
  private logTokens;
  addImageGenerationUsage(usage: ImageGenerationUsage, duration?: number): void;
  addUsage(usage: ChatCompletionUsage, duration?: number): void;
  /**
   * Adds usage statistics to the current instance.
   *
   * @param req - The request containing details about the chat completion.
   * @param usage - The usage statistics to be added.
   */
  addRequestUsage(
    modelId: string,
    req: CreateChatCompletionRequest,
    resp: ChatCompletionResponse,
  ): void;
}
//# sourceMappingURL=usage.d.ts.map
