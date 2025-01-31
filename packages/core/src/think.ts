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
