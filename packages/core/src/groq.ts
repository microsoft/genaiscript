import { parse, evaluate } from "groq-js"
/**
 * Loads and applies GROQ transformation to the input data
 * @param input
 */
export async function GROQEvaluate(
    query: string,
    dataset: any,
    options?: {
        root?: any
        params?: Record<string, unknown>
    }
): Promise<any> {
    if (dataset === undefined) return dataset

    const tree = parse(query)
    const value = await evaluate(tree, { dataset, ...(options || {}) })
    const res = await value.get()
    return res
}
