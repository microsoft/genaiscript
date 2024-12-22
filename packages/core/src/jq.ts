import _jq from "jqts"

/**
 * Loads and applies JQ transformation to the input data
 * @param input
 */
export function jq(input: any, query: string): any {
    if (input === undefined) return input

    const pattern = _jq.compile(query)
    const res = pattern.evaluate(input)[0]
    return res
}
