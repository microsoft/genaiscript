import { XMLParser } from "fast-xml-parser"
import { logError } from "./util"
import { unfence } from "./fence"

export function XMLTryParse(
    text: string,
    defaultValue?: any,
    options?: XMLParseOptions
) {
    try {
        return XMLParse(text, options) ?? defaultValue
    } catch (e) {
        logError(e)
        return defaultValue
    }
}

export function XMLParse(text: string, options?: XMLParseOptions) {
    const cleaned = unfence(text, "xml")
    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        allowBooleanAttributes: true,
        ignoreDeclaration: true,
        parseAttributeValue: true,
        ...(options || {}),
    })
    return parser.parse(cleaned)
}
