import { assert } from "./assert"

// chunk string into chunks of size n
export function chunkString(s: string, n: number = 2 << 14) {
    if (!s?.length) return []
    if (s.length <= n) return [s]

    const r: string[] = []
    for (let i = 0; i < s.length; i += n) {
        r.push(s.slice(i, i + n))
        assert(r[r.length - 1].length <= n)
    }
    return r
}

/**
 * Splits a string into chunks based on line breaks, ensuring that each chunk does not exceed a specified size.
 * If the length of the string is less than or equal to the specified size, it returns the string as a single element array.
 * Each chunk is created by concatenating lines until the maximum size is reached, after which a new chunk is initiated.
 *
 * @param s The input string to be chunked.
 * @param n The maximum size of each chunk (default is 2 << 14).
 * @returns An array of string chunks.
 */
export function chunkLines(s: string, n: number = 2 << 14) {
    if (!s?.length) return []
    if (s.length <= n) return [s]

    const r: string[] = [""]
    const lines = s.split(/\r?\n/)
    for (const line of lines) {
        if (r[r.length - 1].length + line.length > n) r.push("")
        r[r.length - 1] += line + "\n"
    }
    return r
}
