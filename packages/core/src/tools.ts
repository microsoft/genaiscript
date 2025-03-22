import debug from "debug"
const dbg = debug("genai:tools")

import { MODEL_PROVIDERS } from "./constants"
import { parseModelIdentifier } from "./models"

export function escapeToolName(name: string) {
    return name
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .replace("-", "_")
        .replace(/_{2,}/g, "_")
        .replace(/_+$/, "")
}

export function isToolsSupported(modelId: string): boolean | undefined {
    if (!modelId) {
        return undefined
    }
    const { provider, family } = parseModelIdentifier(modelId)

    dbg(`searching for provider info for provider: ${provider}`)
    const info = MODEL_PROVIDERS.find(({ id }) => provider === id)
    if (info) {
        dbg(`tools support is explicitly disabled for model family: ${family}`)
        const value = info.models?.[family]?.tools
        if (typeof value === "boolean") {
            dbg(`model family ${family} = ${value}`)
            return value
        }
        dbg(`tools support is explicitly disabled for provider: ${provider}`)
        if (info.tools === false) {
            return false
        }
    }

    dbg(`checking if model family matches restricted o1 patterns: ${family}`)
    if (/^o1-(mini|preview)/.test(family)) {
        return false
    }

    dbg(`model family tool support is undefined: ${family}`)
    return undefined
}
