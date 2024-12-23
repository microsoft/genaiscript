import { parse, evaluate } from "groq-js"
/**
 * Loads and applies JQ transformation to the input data
 * @param input
 */
export function GROQEvaluate(query: string, dataset: any): any {
    if (dataset === undefined) return dataset

    const tree = parse(query)
    const res = evaluate(tree, { dataset })
    return res
}
