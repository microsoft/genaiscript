import { THINK_REGEX } from "./constants"
import { assert } from "./util"

export function convertThinkToMarkdown(md: string) {
    if (!md) return md

    md = md.replace(/\s*<think>(.*?)($|<\/think>)/gis, (_, text, end) => {
        return `<details><summary>🤔 think${end === "</think>" ? "" : "ing..."}</summary>${text}</details>`
    })
    return md
}

export function unthink(md: string) {
    if (!md) return md

    md = md.replace(/<think>(.*?)($|<\/think>)/gis, "")
    return md
}

export function assertUnthinked(md: string) {
    assert(!md || !THINK_REGEX.test(md), "think tag found")
}
