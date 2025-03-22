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
    if (info?.tools === false) return false

    if (/^o1-(mini|preview)/.test(family)) return false

    const oai = {
        "o1-preview": false,
        "o1-mini": false,
    }
    const data: Record<string, Record<string, boolean>> = {
        [MODEL_PROVIDER_OLLAMA]: {
            ["marco-o1"]: false,
            ["tulu3"]: false,
            ["opencoder"]: false,
            ["llama3.2-vision"]: false,
            ["phi3.5"]: false,
            ["gemma2"]: false,
            ["deep-seek-coder-v2"]: false,
            ["codegemma"]: false,
            ["llava"]: false,
            ["llama3"]: false,
            ["gemma"]: false,
            ["qwen"]: false,
            ["phi3"]: false,
            ["llama2"]: false,
            ["codellama"]: false,
            ["phi"]: false,
            ["deepseek-r1"]: false,
            ["gemma3"]: false
        },
        [MODEL_PROVIDER_OPENAI]: oai,
        [MODEL_PROVIDER_AZURE_OPENAI]: oai,
        [MODEL_PROVIDER_AZURE_SERVERLESS_MODELS]: oai,
        [MODEL_PROVIDER_GITHUB]: {
            "Phi-3.5-mini-instruct": false,
        },
    }

    const res = data[provider]?.[family]
    return res
}
