import { parse, stringify } from "ini"
import { logError } from "./util"

export function INIParse(text: string) {
    return parse(text)
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
