import { type PromptGeneratorOptions, type Awaitable, type ChatGenerationContext, type ChatGenerationContextOptions, type RunPromptResult } from "@genaiscript/core";
/**
 * Uses an LLM to map items to results.
 */
export declare function mapPrompt<T, R>(items: ArrayLike<T>, generator: (ctx: ChatGenerationContext, item: T, itemIndex: number) => Awaitable<unknown>, map: (result: RunPromptResult, item: T, itemIndex: number) => Awaitable<R>, options?: PromptGeneratorOptions & ChatGenerationContextOptions): Promise<R[]>;
/**
 * Map reduce items using an LLM.
 * @param items items to reduce
 * @param reduce reduce function
 * @param generator LLM generate that takes reduced value and item to generate output
 * @param defaultValue Starting value for reduction
 * @param options LLM options
 * @returns Reduced value
 */
export declare function reducePrompt<T, R>(items: ArrayLike<T>, generator: (ctx: ChatGenerationContext, reduced: R, item: T, itemIndex: number) => Awaitable<unknown>, reduce: (reduced: R, item: T, result: RunPromptResult) => Awaitable<R>, defaultValue?: R, options?: PromptGeneratorOptions & ChatGenerationContextOptions): Promise<R | undefined>;
//# sourceMappingURL=mapreduce.d.ts.map