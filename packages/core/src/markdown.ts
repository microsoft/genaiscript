import { convertAnnotationsToMarkdown } from "./annotations"

export function pretifyMarkdown(md: string) {
    let res = md
    res = convertAnnotationsToMarkdown(res)
    return res
}
