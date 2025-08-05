/**
 * This module provides functionality for estimating costs and tracking usage statistics
 * related to chat completions, including generating detailed reports and logs.
 */
import type { ChatCompletionResponse, ChatCompletionUsage, CreateChatCompletionRequest } from "./chattypes.js";
import type { MarkdownTrace } from "./trace.js";
import type { ImageGenerationUsage } from "./chat.js";
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
    addRequestUsage(modelId: string, req: CreateChatCompletionRequest, resp: ChatCompletionResponse): void;
    /**
     * Generates a compact markdown report suitable for GitHub comments.
     *
     * The report contains:
     * - A collapsible `<details>` section with aggregate usage statistics in the summary
     * - A table showing individual LLM call details including model, tokens, costs, and duration
     * - Proper formatting for tokens (t, kt, Mt) and costs (¢, $)
     * - Duration formatting (ms, s, m, h)
     *
     * @returns A markdown string with a details section containing aggregate results
     *          as summary and a table with individual LLM call usage, tokens, and costs.
     *
     * @example
     * ```typescript
     * const stats = new GenerationStats("openai:gpt-4", "main");
     * stats.addUsage({ prompt_tokens: 100, completion_tokens: 50, total_tokens: 150, duration: 1000 }, 1000);
     *
     * const child = stats.createChild("openai:gpt-3.5-turbo", "helper");
     * child.addUsage({ prompt_tokens: 200, completion_tokens: 100, total_tokens: 300, duration: 2000 }, 2000);
     *
     * const report = stats.toMarkdownReport();
     * // Returns:
     * // <details>
     * // <summary>💰 Usage Report 450t 3000ms</summary>
     * // |Model|Label|↑|↓|⇅|$|⏱️|
     * // |-----|-----|--|--|--|----| -------|
     * // |openai:gpt-4|main|100t|50t|150t|0.60¢|1000ms|
     * // |openai:gpt-3.5-turbo|helper|200t|100t|300t|0.30¢|2000ms|
     * // </details>
     * ```
     */
    toMarkdownReport(): string;
}
//# sourceMappingURL=usage.d.ts.map