import {
    MODEL_PROVIDER_AZURE_OPENAI,
    MODEL_PROVIDER_AZURE_SERVERLESS_MODELS,
    MODEL_PROVIDER_GITHUB,
    MODEL_PROVIDER_OLLAMA,
    MODEL_PROVIDER_OPENAI,
    MODEL_PROVIDERS,
} from "./constants"
import { parseModelIdentifier } from "./models"

export function escapeToolName(name: string) {
    return name
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .replace("-", "_")
        .replace(/_{2,}/g, "_")
}

export function isToolsSupported(modelId: string): boolean | undefined {
    if (!modelId) return undefined
    const { provider, family } = parseModelIdentifier(modelId)

    const info = MODEL_PROVIDERS.find(({ id }) => provider === id)
    if (info?.models?.[family]?.tools === false) return false
    if (info?.tools === false) return false

    if (/^o1-(mini|preview)/.test(family)) return false

    return undefined
}
