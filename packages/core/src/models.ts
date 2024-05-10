import { AICIModel } from "./aici"
import { LanguageModel } from "./chat"
import {
    DEFAULT_MODEL,
    MODEL_PROVIDER_AICI,
    MODEL_PROVIDER_AZURE,
    MODEL_PROVIDER_OLLAMA,
    MODEL_PROVIDER_OPENAI,
} from "./constants"
import { errorMessage } from "./error"
import { OAIToken, host } from "./host"
import { OllamaModel } from "./ollama"
import { OpenAIModel } from "./openai"
import { GenerationOptions } from "./promptcontext"
import { TraceOptions } from "./trace"

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
    else return { provider: MODEL_PROVIDER_OPENAI, model: id, modelId: id }
}

export interface ModelConnectionInfo
    extends ModelConnectionOptions,
        Partial<OAIToken> {
    error?: string
}

export async function resolveModelConnectionInfo(
    conn: ModelConnectionOptions,
    options?: { token?: boolean } & TraceOptions
): Promise<{ info: ModelConnectionInfo; token?: OAIToken }> {
    const { trace } = options
    try {
        trace?.startDetails(`configuration`)
        const secret = await host.getSecretToken(conn)
        trace?.itemValue(`model`, conn.model ?? DEFAULT_MODEL)
        if (!secret) {
            return { info: { ...conn } }
        } else {
            const { token: theToken, ...rest } = secret
            const starToken = theToken
                ? options?.token
                    ? theToken
                    : "***"
                : ""
            trace?.itemValue(`base`, rest.base)
            trace?.itemValue(`type`, rest.type)
            trace?.itemValue(`version`, rest.version)
            trace?.itemValue(`token`, starToken)
            trace?.itemValue(`source`, rest.source)
            return {
                info: {
                    ...conn,
                    ...rest,
                    token: starToken,
                },
                token: secret,
            }
        }
    } catch (e) {
        trace?.error(undefined, e)
        return {
            info: {
                ...conn,
                error: errorMessage(e),
            },
        }
    } finally {
        trace?.endDetails()
    }
}
