/**
 * Loads and applies JQ transformation to the input data
 * @param input
 * @param query
 * @returns
 */
export async function jq(input: any, query: string) {
    const { executeScript } = await import("@elastic/micro-jq")
    return executeScript(input, query)
}
