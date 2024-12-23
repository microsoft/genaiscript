import { parse, evaluate } from "groq-js"
/**
 * Loads and applies GROQ transformation to the input data
 * @param input
 */
export async function GROQEvaluate(query: string, dataset: any): Promise<any> {
    if (dataset === undefined) return dataset

    const tree = parse(query)
    const value = await evaluate(tree, { dataset })
    const res = await value.get()
    return res
}
