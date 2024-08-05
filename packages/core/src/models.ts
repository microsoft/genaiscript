import { MODEL_PROVIDER_LLAMAFILE, MODEL_PROVIDER_OPENAI } from "./constants"
import { errorMessage } from "./error"
import { LanguageModelConfiguration, host, runtimeHost } from "./host"
import { AbortSignalOptions, MarkdownTrace, TraceOptions } from "./trace"
import { assert } from "./util"

/**
 * model
 * provider:model
 * provider:model:tag where modelId model:tag
 */
export function parseModelIdentifier(id: string): {
    provider: string
    family: string
    model: string
    tag?: string
} {
    assert(!!id)
    id = id.replace("-35-", "-3.5-")
    const parts = id.split(":")
    if (parts.length >= 3)
        return {
            provider: parts[0],
            family: parts[1],
            tag: parts.slice(2).join(":"),
            model: parts.slice(1).join(":"),
        }
    else if (parts.length === 2)
        return { provider: parts[0], family: parts[1], model: parts[1] }
    else if (id === MODEL_PROVIDER_LLAMAFILE)
        return { provider: MODEL_PROVIDER_LLAMAFILE, family: "*", model: id }
    else return { provider: MODEL_PROVIDER_OPENAI, family: id, model: id }
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
        trace.itemValue(`version`, version)
        trace.itemValue(`source`, source)
        trace.itemValue(`provider`, provider)
        trace.itemValue(`temperature`, temperature)
        trace.itemValue(`topP`, topP)
        trace.itemValue(`maxTokens`, maxTokens)
        trace.itemValue(`base`, base)
        trace.itemValue(`type`, type)
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
    const hasModel = options?.model ?? conn.model
    const model = options?.model ?? conn.model ?? runtimeHost.defaultModelOptions.model
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
                    token: theToken ? (hasModel ? theToken : "***") : "",
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
