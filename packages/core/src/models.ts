import { AICIModel } from "./aici"
import { LanguageModel } from "./chat"
import {
    DEFAULT_MODEL,
    MODEL_PROVIDER_AICI,
    MODEL_PROVIDER_AZURE,
    MODEL_PROVIDER_LLAMAFILE,
    MODEL_PROVIDER_OLLAMA,
    MODEL_PROVIDER_OPENAI,
} from "./constants"
import { errorMessage } from "./error"
import { LanguageModelConfiguration, host } from "./host"
import { OllamaModel } from "./ollama"
import { OpenAIModel } from "./openai"
import { TraceOptions } from "./trace"

export function resolveLanguageModel(options: {
    model?: string
    languageModel?: LanguageModel
}): LanguageModel {
    if (options.languageModel) return options.languageModel
    const { provider } = parseModelIdentifier(options.model)
    if (provider === MODEL_PROVIDER_OLLAMA) return OllamaModel
    if (provider === MODEL_PROVIDER_AICI) return AICIModel
    if (provider === MODEL_PROVIDER_AZURE) return OpenAIModel
    //MODEL_PROVIDER_LITELLM
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
    else if (id === MODEL_PROVIDER_LLAMAFILE)
        return { provider: MODEL_PROVIDER_LLAMAFILE, model: "*", modelId: id }
    else return { provider: MODEL_PROVIDER_OPENAI, model: id, modelId: id }
}

export interface ModelConnectionInfo
    extends ModelConnectionOptions,
        Partial<LanguageModelConfiguration> {
    error?: string
    model: string
}

export async function resolveModelConnectionInfo(
    conn: ModelConnectionOptions,
    options?: { model?: string; token?: boolean } & TraceOptions
): Promise<{ info: ModelConnectionInfo; token?: LanguageModelConfiguration }> {
    const { trace } = options || {}
    const model = options.model ?? conn.model ?? DEFAULT_MODEL
    try {
        trace?.startDetails(`⚙️ configuration`)
        trace?.itemValue(`model`, model)
        const secret = await host.getLanguageModelConfiguration(model)
        if (!secret) {
            return { info: { ...conn, model } }
        } else {
            const { token: theToken, ...rest } = secret
            trace?.itemValue(`base`, rest.base)
            trace?.itemValue(`type`, rest.type)
            trace?.itemValue(`version`, rest.version)
            trace?.itemValue(`source`, rest.source)
            return {
                info: {
                    ...conn,
                    ...rest,
                    model,
                    token: theToken ? (options?.token ? theToken : "***") : "",
                },
                token: secret,
            }
        }
    } catch (e) {
        trace?.error(undefined, e)
        return {
            info: {
                ...conn,
                model,
                error: errorMessage(e),
            },
        }
    } finally {
        trace?.endDetails()
    }
}
