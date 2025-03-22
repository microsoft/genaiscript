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
    if (!modelId) return undefined
    const { provider, family } = parseModelIdentifier(modelId)

    const info = MODEL_PROVIDERS.find(({ id }) => provider === id)
    if (info) {
        if (info.models?.[family]?.tools === false) return false
        if (info.tools === false) return false
    }

    if (/^o1-(mini|preview)/.test(family)) return false

    return undefined
}
