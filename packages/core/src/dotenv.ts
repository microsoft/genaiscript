import { parse } from "dotenv"
import { logError } from "./util"

export function dotEnvTryParse(text: string): Record<string, string> {
    try {
        return parse(text)
    } catch (e) {
        logError(e)
        return {}
    }
}

export const dotEnvParse = parse
