import { diffLines } from "diff"
import { fenceMD } from "./mkmd"

export function markdownDiff(
    oldStr: string,
    newStr: string,
    options?: {
        lang?: string
        ignoreWhitespace?: boolean
    }
) {
    const { lang, ...rest } = options || {}

    if (!oldStr) return fenceMD(newStr, lang)

    const changes = diffLines(oldStr || "", newStr || "", rest)
    const source = changes
        .map((c) => `${c.added ? "+" : c.removed ? "-" : " "}${c.value}`)
        .join("")
    return fenceMD(source, "diff")
}
