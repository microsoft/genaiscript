import { assert } from "./assert"

/**
* Splits a string into chunks of specified size.
* Parameters:
* - s: Input string to split. Must be non-null.
* - n: Maximum size of each chunk. Defaults to 2 << 14.
* Returns:
* - Array of string chunks.
*/
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
