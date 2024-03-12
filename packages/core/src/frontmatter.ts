import { JSON5TryParse } from "./json5"
import { TOMLTryParse } from "./toml"
import { YAMLTryParse } from "./yaml"

export function frontmatterTryParse(
    text: string,
    options?: { format: "yaml" | "json" | "toml" }
) {
    if (!text) return undefined

    const { format = "yaml" } = options || {}

    const delimiter = "---\n"
    if (!text.startsWith(delimiter)) return undefined

    const end = text.indexOf(delimiter, delimiter.length)
    if (end < 0) return undefined

    const fm = text.slice(delimiter.length, end).trim()
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
    return res
}
