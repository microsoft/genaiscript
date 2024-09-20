import { parse, stringify } from "ini"
import { logError } from "./util"
import { unfence } from "./fence"

export function INIParse(text: string) {
    const cleaned = unfence(text, "ini")
    return parse(cleaned)
}

export function INITryParse(text: string, defaultValue?: any) {
    try {
        return INIParse(text)
    } catch (e) {
        logError(e)
        return defaultValue
    }
}

export function INIStringify(o: any) {
    return stringify(o)
}
