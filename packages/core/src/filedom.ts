import { CSVToMarkdown } from "./csv"
import { fenceMD } from "./markdown"
import { createTextNode } from "./promptdom"
import { YAMLStringify } from "./yaml"

export function createDefDataNode(
    name: string,
    data: object | object[],
    env: ExpansionVariables,
    options?: DefDataOptions
) {
    if (data === undefined) return undefined

    let { format, headers, priority, maxTokens } = options || {}
    if (!format && headers && Array.isArray(data)) format = "csv"
    else if (!format) format = "yaml"

    let text: string
    let lang: string
    if (Array.isArray(data) && format === "csv") {
        text = CSVToMarkdown(data, { headers })
    } else if (format === "json") {
        text = JSON.stringify(data)
        lang = "json"
    } else {
        text = YAMLStringify(data)
        lang = "yaml"
    }

    const value = `${name}:
    ${lang ? fenceMD(text, lang) : text}`
    return createTextNode(value, { priority, maxTokens })
}
