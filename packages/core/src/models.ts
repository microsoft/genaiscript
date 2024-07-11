import assert from "assert"
import { AICIModel } from "./aici"
import { LanguageModel } from "./chat"
import {
    MODEL_PROVIDER_AICI,
    MODEL_PROVIDER_LLAMAFILE,
    MODEL_PROVIDER_OLLAMA,
    MODEL_PROVIDER_OPENAI,
} from "./constants"
import { errorMessage } from "./error"
import { LanguageModelConfiguration, host } from "./host"
import { OllamaModel } from "./ollama"
import { OpenAIModel } from "./openai"
import { AbortSignalOptions, MarkdownTrace, TraceOptions } from "./trace"

export function resolveLanguageModel(
    options: {
        model?: string
        languageModel?: LanguageModel
    },
    configuration: LanguageModelConfiguration
): LanguageModel {
    const { model, languageModel } = options || {}
    if (languageModel) return languageModel

    const { provider } = parseModelIdentifier(model)
    if (provider === MODEL_PROVIDER_OLLAMA) return OllamaModel
    if (provider === MODEL_PROVIDER_AICI) return AICIModel
    return OpenAIModel
}

/**
 * model
 * provider:model
 * provider:model:tag where modelId model:tag
 */
export function parseModelIdentifier(id: string) {
    assert(!!id)
    id = id.replace("-35-", "-3.5-")
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

export function traceLanguageModelConnection(
    trace: MarkdownTrace,
    options: ModelOptions,
    connectionToken: LanguageModelConfiguration
) {
    const {
        model,
        temperature,
        topP,
        maxTokens,
        seed,
        cacheName,
        responseType,
        responseSchema,
    } = options
    const { base, type, version, source, provider } = connectionToken
    trace.startDetails(`⚙️ configuration`)
    try {
        trace.itemValue(`model`, model)
        trace.itemValue(`temperature`, temperature)
        trace.itemValue(`topP`, topP)
        trace.itemValue(`maxTokens`, maxTokens)
        trace.itemValue(`base`, base)
        trace.itemValue(`type`, type)
        trace.itemValue(`version`, version)
        trace.itemValue(`source`, source)
        trace.itemValue(`provider`, provider)
        trace.itemValue(`model`, model)
        trace.itemValue(`temperature`, temperature)
        trace.itemValue(`top_p`, topP)
        trace.itemValue(`seed`, seed)
        trace.itemValue(`cache name`, cacheName)
        trace.itemValue(`response type`, responseType)
        if (responseSchema)
            trace.detailsFenced(`📦 response schema`, responseSchema, "json")
    } finally {
        trace.endDetails()
    }
}

export async function resolveModelConnectionInfo(
    conn: ModelConnectionOptions,
    options?: { model?: string; token?: boolean } & TraceOptions &
        AbortSignalOptions
): Promise<{
    info: ModelConnectionInfo
    configuration?: LanguageModelConfiguration
}> {
    const { trace, token: askToken, signal } = options || {}
    const model = options.model ?? conn.model ?? host.defaultModelOptions.model
    try {
        const configuration = await host.getLanguageModelConfiguration(model, {
            token: askToken,
            signal,
            trace,
        })
        if (!configuration) {
            return { info: { ...conn, model } }
        } else {
            const { token: theToken, ...rest } = configuration
            return {
                info: {
                    ...conn,
                    ...rest,
                    model,
                    token: theToken ? (options?.token ? theToken : "***") : "",
                },
                configuration,
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
    }
}
