import type { ChatGenerationContextOptions } from "@genaiscript/core";
/**
 * Enhances content generation by applying iterative improvements.
 *
 * @param options - Configuration for the improvement process.
 * @param options.ctx - Chat generation context to use. Defaults to the environment generator if not provided.
 * @param options.repeat - Number of improvement iterations to perform. Defaults to 1.
 * @param options.instructions - Custom instructions for improvement. Defaults to "Make it better!".
 * The instructions are applied in each iteration.
 */
export declare function makeItBetter(options?: ChatGenerationContextOptions & {
    repeat?: number;
    instructions?: string;
}): void;
//# sourceMappingURL=makeitbetter.d.ts.map