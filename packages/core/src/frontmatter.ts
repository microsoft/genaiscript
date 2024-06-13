import { JSON5TryParse } from "./json5"
import { TOMLTryParse } from "./toml"
import { YAMLTryParse } from "./yaml"

export function frontmatterTryParse(
    text: string,
    options?: { format: "yaml" | "json" | "toml" }
): { end: number; value: any } {
    if (!text) return undefined

    const { format = "yaml" } = options || {}

    const lines = text.split(/\r?\n/g)
    const delimiter = "---"
    if (lines[0] !== delimiter) return undefined
    let end = 1
    while (end < lines.length) {
        if (lines[end] === delimiter) break
        end++
    }
    if (end >= lines.length) return undefined
    const fm = lines.slice(1, end).join("\n")
    let res: any
    switch (format) {
        case "json":
            res = JSON5TryParse(fm)
            break
        case "toml":
            res = TOMLTryParse(fm)
            break
        default:
            res = YAMLTryParse(fm)
            break
    }
    return res !== undefined ? { end: end + 1, value: res } : undefined
}
