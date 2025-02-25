import { deleteUndefinedValues } from "./cleaners"
import { THINK_REGEX } from "./constants"

export function convertThinkToMarkdown(md: string) {
    if (!md) return md

    md = md.replace(THINK_REGEX, (_, text, end) => {
        return `\n<details><summary>🤔 think${end === "</think>" ? "" : "ing..."}</summary>${text}</details>\n`
    })
    return md
}

export function unthink(md: string) {
    if (!md) return md

    md = md.replace(THINK_REGEX, "")
    return md
}

export function splitThink(text: string): { content: string; reasoning: string } {
    const reasoning: string[] = []
    const res = text?.replace(THINK_REGEX, (_, text, end) => {
        reasoning.push(text)
        return ""
    })

    return deleteUndefinedValues({
        content: res,
        reasoning: reasoning.length ? reasoning.join("\n") : undefined,
    })
}
