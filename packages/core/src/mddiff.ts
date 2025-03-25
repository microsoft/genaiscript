import { diffLines } from "diff"
import { fenceMD } from "./mkmd"

/**
 * Generates a markdown representation of the differences between two strings.
 *
 * This function computes the diff between `oldStr` and `newStr`, highlighting added and removed lines.
 * If `oldStr` is undefined, it returns the new string wrapped in markdown fencing.
 *
 * @param oldStr - The original string.
 * @param newStr - The modified string.
 * @param options - Optional settings for processing the strings.
 *   - lang - Language for syntax highlighting in the markdown output.
 *   - ignoreWhitespace - Flag to ignore whitespace differences when calculating the diff.
 * @returns A string containing the differences in markdown format, suitable for display.
 */
export function markdownDiff(
    oldStr: string,
    newStr: string,
    options?: {
        lang?: string
        ignoreWhitespace?: boolean
    }
) {
    const { lang, ...rest } = options || {}

    if (oldStr === undefined) return fenceMD(newStr, lang)

    const changes = diffLines(oldStr || "", newStr || "", rest)
    const source = changes
        .map((c) => `${c.added ? "+" : c.removed ? "-" : " "}${c.value}`)
        .join("")
    return fenceMD(source, "diff")
}
