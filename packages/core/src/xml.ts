import { XMLParser } from "fast-xml-parser"
import { logError } from "./util"

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
    const parser = new XMLParser({
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        allowBooleanAttributes: true,
        ignoreDeclaration: true,
        parseAttributeValue: true,
        ...(options || {}),
    })
    return parser.parse(text)
}
