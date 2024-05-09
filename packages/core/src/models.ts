import { AICIModel } from "./aici"
import { LanguageModel } from "./chat"
import {
    DEFAULT_MODEL,
    MODEL_PROVIDER_AICI,
    MODEL_PROVIDER_AZURE,
    MODEL_PROVIDER_OLLAMA,
} from "./constants"
import { errorMessage } from "./error"
import { OAIToken, host } from "./host"
import { OllamaModel } from "./ollama"
import { OpenAIModel } from "./openai"
import { GenerationOptions } from "./promptcontext"

export function resolveLanguageModel(
    options: GenerationOptions
): LanguageModel {
    if (options.languageModel) return options.languageModel
    const { provider } = parseModelIdentifier(options.model)
    if (provider === MODEL_PROVIDER_OLLAMA) return OllamaModel
    if (provider === MODEL_PROVIDER_AICI) return AICIModel
    if (provider === MODEL_PROVIDER_AZURE) return OpenAIModel
    return OpenAIModel
}

/**
 * model
 * provider:model
 * provider:model:size where modelId model:size
 */
export function parseModelIdentifier(id: string) {
    id = (id ?? DEFAULT_MODEL).replace("-35-", "-3.5-")
    const parts = id.split(":")
    if (parts.length >= 3)
        return {
            provider: parts[0],
            model: parts[1],
            tag: parts.slice(2).join(":"),
            modelId: parts.slice(1).join(":"),
        }
    else if (parts.length === 2)
        return { provider: parts[0], model: parts[1], modelId: parts[1] }
    else return { provider: "openai", model: id, modelId: id }
}

export interface ModelConnectionInfo
    extends ModelConnectionOptions,
        Partial<OAIToken> {
    error?: string
}

export async function resolveModelConnectionInfo(
    conn: ModelConnectionOptions,
    options?: { token?: boolean }
): Promise<{ info: ModelConnectionInfo; token?: OAIToken }> {
    try {
        const secret = await host.getSecretToken(conn)
        if (!secret) {
            return { info: { ...conn, error: "model configuration not found" } }
        } else {
            const { token: theToken, ...rest } = secret
            return {
                info: {
                    ...conn,
                    ...rest,
                    token: theToken ? (options?.token ? theToken : "***") : "",
                },
                token: secret,
            }
        }
    } catch (e) {
        return {
            info: {
                ...conn,
                error: errorMessage(e),
            },
        }
    }
}
