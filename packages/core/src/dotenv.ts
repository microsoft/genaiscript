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

export function dotEnvStringify(record: Record<string, string>): string {
    return Object.entries(record || {})
        .map(([key, value]) => {
            if (value === undefined || value === null) value = ""
            // If the value contains newlines or quotes, enclose it in double quotes and escape existing quotes
            if (value.includes("\n") || value.includes('"')) {
                value = value.replace(/"/g, '\\"') // Escape existing quotes
                return `${key}="${value}"`
            }
            return `${key}=${value}`
        })
        .join("\n")
}
