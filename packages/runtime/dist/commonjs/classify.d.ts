/**
 * GenAIScript supporting runtime
 * This module provides core functionality for text classification, data transformation,
 * PDF processing, and file system operations in the GenAIScript environment.
 */
import type { ChatGenerationContextOptions, Logprob, PromptGenerator, PromptGeneratorOptions, RunPromptUsage, StringLike } from "@genaiscript/core";
/**
 * Options for classifying data using AI models.
 *
 * @property {boolean} [other] - Inject a 'other' label.
 * @property {boolean} [explanations] - Explain answers before returning token.
 * @property {ChatGenerationContext} [ctx] - Options runPrompt context.
 */
export type ClassifyOptions = {
    /**
     * When true, adds an 'other' category to handle cases that don't match defined labels
     */
    other?: boolean;
    /**
     * When true, provides explanatory text before the classification result
     */
    explanations?: boolean;
} & ChatGenerationContextOptions & Omit<PromptGeneratorOptions, "choices">;
/**
 * Classifies input text into predefined categories using AI.
 * Inspired by https://github.com/prefecthq/marvin.
 *
 * @param text - Text content to classify or a prompt generator function.
 * @param labels - Object mapping label names to their descriptions.
 * @param options - Configuration options for classification, including whether to add an "other" category, provide explanations, and specify context.
 * @returns Classification result containing the chosen label, confidence metrics, log probabilities, the full answer text, and usage statistics.
 * @throws Error if fewer than two labels are provided (including "other").
 */
export declare function classify<L extends Record<string, string>>(text: StringLike | PromptGenerator, labels: L, options?: ClassifyOptions): Promise<{
    label: keyof typeof labels | "other";
    entropy?: number;
    logprob?: number;
    probPercent?: number;
    answer: string;
    logprobs?: Record<keyof typeof labels | "other", Logprob>;
    usage?: RunPromptUsage;
    error?: string;
}>;
//# sourceMappingURL=classify.d.ts.map