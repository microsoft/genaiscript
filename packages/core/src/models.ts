import { uniq } from "es-toolkit"
import { LARGE_MODEL_ID } from "./constants"
import { errorMessage } from "./error"
import { host, ModelConfiguration, runtimeHost } from "./host"
import { MarkdownTrace, TraceOptions } from "./trace"
import { arrayify, assert, logVerbose, toStringList } from "./util"
import { CancellationOptions } from "./cancellation"
import { LanguageModelConfiguration } from "./server/messages"
import { roundWithPrecision } from "./precision"
import { logModelAliases } from "./modelalias"
import { ChatCompletionReasoningEffort } from "./chattypes"

export interface ParsedModelType {
    provider: string
    family: string
    model: string
    tag?: string
    reasoningEffort?: ChatCompletionReasoningEffort
}

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
    reasoningEffort?: ChatCompletionReasoningEffort
} {
    assert(!!id)
    let reasoningEffort: ChatCompletionReasoningEffort
    const parts = id.split(":")
    if (/^(high|medium|low)$/.test(parts.at(-1)))
        reasoningEffort = parts.pop() as ChatCompletionReasoningEffort

    let res: ParsedModelType
    if (parts.length >= 3)
        res = {
            provider: parts[0],
            family: parts[1],
            tag: parts.slice(2).join(":"),
            model: parts.slice(1).join(":"),
        }
    else if (parts.length === 2)
        res = { provider: parts[0], family: parts[1], model: parts[1] }
    else res = { provider: id, family: "*", model: "*" }
    if (reasoningEffort) res.reasoningEffort = reasoningEffort
    return res
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
        reasoningEffort,
        fallbackTools,
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
        trace.itemValue(`reasoningEffort`, reasoningEffort)
        trace.itemValue(`fallbackTools`, fallbackTools)
        trace.itemValue(`topP`, topP)
        trace.itemValue(`maxTokens`, maxTokens)
        trace.itemValue(`base`, base)
        trace.itemValue(`type`, type)
        trace.itemValue(`seed`, seed)
        if (choices.length)
            trace.itemValue(
                `choices`,
                choices
                    .map((c) =>
                        typeof c === "string"
                            ? c
                            : `${c.token} - ${roundWithPrecision(c.weight, 2)}`
                    )
                    .join(",")
            )
        trace.itemValue(`logprobs`, logprobs)
        if (topLogprobs) trace.itemValue(`topLogprobs`, topLogprobs)
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

export function resolveModelAlias(model: string): ModelConfiguration {
    const { modelAliases } = runtimeHost
    const seen: string[] = []
    let res: ModelConfiguration = {
        model: model || LARGE_MODEL_ID,
        source: "script",
    }
    while (modelAliases[res.model]) {
        let next = modelAliases[res.model]
        if (seen.includes(next.model))
            throw new Error(
                `Circular model alias: ${next.model}, seen ${[...seen].join(",")}`
            )
        seen.push(next.model)
        res = next
    }
    return res
}

const resolvedModels = new Set<string>()
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
    const hint = options?.model || conn.model
    const { provider } = parseModelIdentifier(hint)
    // supports candidate if no model hint or hint is a model alias
    const resolved = resolveModelAlias(hint)
    const supportsCandidates = !provider
    const modelId = resolved.model
    let candidates = supportsCandidates ? resolved.candidates : undefined

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
        const logg = !resolvedModels.has(modelId)
        resolvedModels.add(modelId)
        candidates = uniq([modelId, ...(candidates || [])].filter((c) => !!c))
        if (logg) logVerbose(`connection: resolving ${hint || "large"}`)
        for (const candidate of candidates) {
            const res = await resolveModel(candidate, {
                withToken: askToken,
                reportError: false,
            })
            if (!res.info.error && res.info.token) {
                if (logg) logVerbose(`  resolved ${candidate}`)
                return res
            }
        }

        logVerbose(`candidates: ${candidates.join(", ")}`)
        logModelAliases({ all: true })
        return {
            info: {
                model: "?",
                error: hint
                    ? `LLM provider not configured for '${hint}'`
                    : "LLM provider not configured",
            },
        }
    }
}
