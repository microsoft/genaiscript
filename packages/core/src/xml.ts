import { XMLParser } from "fast-xml-parser"
import { logError } from "./util"

export interface XMLParseOptions {
    allowBooleanAttributes?: boolean
    ignoreAttributes?: boolean
    ignoreDeclaration?: boolean
    ignorePiTags?: boolean
    parseAttributeValue?: boolean
    removeNSPrefix?: boolean
    unpairedTags?: string[]
}

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
    const parser = new XMLParser(options)
    return parser.parse(text)
}
