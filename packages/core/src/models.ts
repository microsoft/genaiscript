import { uniq } from "es-toolkit"
import {
    LARGE_MODEL_ID,
    MODEL_PROVIDER_LLAMAFILE,
    MODEL_PROVIDER_OPENAI,
} from "./constants"
import { errorMessage } from "./error"
import { host, runtimeHost } from "./host"
import { MarkdownTrace, TraceOptions } from "./trace"
import { arrayify, assert, logVerbose, toStringList } from "./util"
import { CancellationOptions } from "./cancellation"
import { LanguageModelConfiguration } from "./server/messages"

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
        cache,
        logprobs,
        topLogprobs,
        responseType,
        responseSchema,
        fenceFormat,
    } = options
    const choices = arrayify(options.choices)
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
        if (choices.length) trace.itemValue(`choices`, choices.join(","))
        trace.itemValue(`logprobs`, logprobs)
        trace.itemValue(`topLogprobs`, topLogprobs)
        trace.itemValue(`cache`, cache)
        trace.itemValue(`fence format`, fenceFormat)
        trace.itemValue(`response type`, responseType)
        if (responseSchema)
            trace.detailsFenced(`📦 response schema`, responseSchema, "json")

        trace.startDetails(`🔗 model aliases`)
        Object.entries(runtimeHost.modelAliases).forEach(([key, value]) =>
            trace.itemValue(
                key,
                toStringList(
                    `\`${value.model}\``,
                    isNaN(value.temperature)
                        ? undefined
                        : `temperature: \`${value.temperature}\``,
                    `source: \`${value.source}\``
                )
            )
        )
        trace.endDetails()
    } finally {
        trace.endDetails()
    }
}

export async function resolveModelConnectionInfo(
    conn: ModelConnectionOptions,
    options?: {
        model?: string
        token?: boolean
    } & TraceOptions &
        CancellationOptions
): Promise<{
    info: ModelConnectionInfo
    configuration?: LanguageModelConfiguration
}> {
    const { trace, token: askToken, cancellationToken } = options || {}
    const { modelAliases } = runtimeHost
    const hint = options?.model || conn.model
    // supports candidate if no model hint or hint is a model alias
    const supportsCandidates = !hint || !!modelAliases[hint]
    let modelId = hint || LARGE_MODEL_ID
    let candidates: string[]
    // recursively resolve model aliases
    {
        const seen: string[] = []
        while (modelAliases[modelId]) {
            const { model: id, candidates: c } = modelAliases[modelId]
            if (seen.includes(id))
                throw new Error(
                    `Circular model alias: ${id}, seen ${[...seen].join(",")}`
                )
            seen.push(modelId)
            modelId = id
            if (supportsCandidates) candidates = c
        }
    }

    const resolveModel = async (
        model: string,
        resolveOptions: { withToken: boolean; reportError: boolean }
    ): Promise<{
        info: ModelConnectionInfo
        configuration?: LanguageModelConfiguration
    }> => {
        try {
            const configuration = await host.getLanguageModelConfiguration(
                model,
                {
                    token: resolveOptions.withToken,
                    cancellationToken,
                    trace,
                }
            )
            if (!configuration) {
                return { info: { ...conn, model } }
            } else {
                const { token: theToken, ...rest } = configuration
                return {
                    info: {
                        ...conn,
                        ...rest,
                        model,
                        token: theToken
                            ? resolveOptions.withToken
                                ? theToken
                                : "***"
                            : "",
                    },
                    configuration,
                }
            }
        } catch (e) {
            if (resolveOptions.reportError) trace?.error(undefined, e)
            return {
                info: {
                    ...conn,
                    model,
                    error: errorMessage(e),
                },
            }
        }
    }

    if (!supportsCandidates) {
        return await resolveModel(modelId, {
            withToken: askToken,
            reportError: true,
        })
    } else {
        logVerbose(`connection: resolving model ${modelId}`)
        candidates = uniq([modelId, ...(candidates || [])].filter((c) => !!c))
        for (const candidate of candidates) {
            logVerbose(`  resolving ${candidate}`)
            const res = await resolveModel(candidate, {
                withToken: askToken,
                reportError: false,
            })
            if (!res.info.error && res.info.token) return res
        }
        return {
            info: {
                model: "?",
                error: hint
                    ? `No LLM provider configured for ${hint}`
                    : "No LLM provider configured",
            },
        }
    }
}
