import { resolveChatGenerationContext, } from "@genaiscript/core";
/**
 * Uses an LLM to map items to results.
 */
export async function mapPrompt(items, generator, map, options) {
    const { runPrompt } = resolveChatGenerationContext(options);
    const results = [];
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const result = await runPrompt(async (ctx) => {
            await generator(ctx, item, i);
        }, {
            ...(options || {}),
            label: `${options?.label || "mapping"} - ${i + 1}/${items.length}`,
        });
        const mapped = await map(result, item, i);
        results.push(mapped);
    }
    return results;
}
/**
 * Map reduce items using an LLM.
 * @param items items to reduce
 * @param reduce reduce function
 * @param generator LLM generate that takes reduced value and item to generate output
 * @param defaultValue Starting value for reduction
 * @param options LLM options
 * @returns Reduced value
 */
export async function reducePrompt(items, generator, reduce, defaultValue, options) {
    const { runPrompt } = resolveChatGenerationContext(options);
    let reduced = defaultValue;
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const promptResult = await runPrompt(async (ctx) => {
            await generator(ctx, reduced, item, i);
        }, {
            ...(options || {}),
            label: `${options?.label || "reducing"} - ${i + 1}/${items.length}`,
        });
        reduced = await reduce(reduced, item, promptResult);
    }
    return reduced;
}
//# sourceMappingURL=mapreduce.js.map