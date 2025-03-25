import debug from "debug"
const dbg = debug("genaiscript:models")

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
    if (!id) throw new Error("Model identifier not specified")
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

/**
 * Traces the configuration of a language model connection.
 *
 * This function logs the details of the model configuration and additional parameters
 * associated with the language model connection. It includes information such as
 * model name, version, provider, and various parameters like temperature and maxTokens.
 * It also handles choices and logs model aliases with their respective details.
 *
 * @param trace - The trace object for logging details.
 * @param options - The model options containing configuration settings.
 * @param connectionToken - The token containing connection-specific information.
 */
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

/**
 * Checks if the given model name corresponds to an existing model alias.
 *
 * The function evaluates the runtimeHost's modelAliases to determine if 
 * the provided model name is recognized as an alias. Returns a boolean 
 * indicating the existence of the alias.
 *
 * @param model - The name of the model to check for alias existence.
 * @returns True if the model is an alias, false otherwise.
 */
export function isModelAlias(model: string): boolean {
    const res = !!runtimeHost.modelAliases[model]
    return res
}

/**
 * Resolves a model alias to its corresponding model configuration.
 * Throws an error if the model is not specified or if a circular alias is detected.
 * 
 * This function checks the runtimeHost for model aliases and resolves the given model
 * by following its aliases until the original model configuration is found.
 * 
 * @param model - The model identifier to resolve.
 * @returns The resolved model configuration.
 */
export function resolveModelAlias(model: string): ModelConfiguration {
    if (!model) throw new Error("Model not specified")
    const { modelAliases } = runtimeHost
    const seen: string[] = []
    let res: ModelConfiguration = {
        model,
        source: "script",
    }
    while (modelAliases[res.model]) {
        let next = modelAliases[res.model]
        dbg(`alias ${res.model} -> ${next.model}`)
        if (seen.includes(next.model))
            throw new Error(
                `Circular model alias: ${next.model}, seen ${[...seen].join(",")}`
            )
        seen.push(next.model)
        res = next
    }
    return res
}

/**
 * Resolves the model connection information based on the provided options and connection parameters.
 * It first attempts to resolve the model alias and checks if candidates can be supported based on the model hint.
 * If a valid model is found, it retrieves the language model configuration.
 * Handles potential errors during resolution and reports them if applicable.
 *
 * @param conn - The model connection options containing connection parameters.
 * @param options - Optional parameters including model hints, default model, and token request.
 * @returns An object containing the resolved model connection information and potentially the configuration.
 */
export async function resolveModelConnectionInfo(
    conn: ModelConnectionOptions,
    options?: {
        model?: string
        defaultModel?: string
        token?: boolean
    } & TraceOptions &
        CancellationOptions
): Promise<{
    info: ModelConnectionInfo
    configuration?: LanguageModelConfiguration
}> {
    const {
        trace,
        token: askToken,
        defaultModel,
        cancellationToken,
    } = options || {}
    const hint = options?.model || conn.model
    dbg(`resolving model for '${hint || ""}'`)
    // supports candidate if no model hint or hint is a model alias
    const resolved = resolveModelAlias(hint || defaultModel)
    if (!resolved)
        return {
            info: { error: "missing error information", model: undefined },
        }

    const supportsCandidates = !hint || isModelAlias(hint)
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
            dbg(`resolving ${model}`)
            const configuration = await host.getLanguageModelConfiguration(
                model,
                {
                    token: resolveOptions.withToken,
                    cancellationToken,
                    trace,
                }
            )
            if (!configuration) {
                dbg(`configuration not found`)
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
            dbg(`error resolving ${model}: ${e}`)
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
        dbg(`candidate ${modelId}`)
        return await resolveModel(modelId, {
            withToken: askToken,
            reportError: true,
        })
    } else {
        candidates = uniq([modelId, ...(candidates || [])].filter((c) => !!c))
        dbg(`candidates: ${candidates?.join(", ")}`)
        for (const candidate of candidates) {
            const res = await resolveModel(candidate, {
                withToken: askToken,
                reportError: false,
            })
            if (!res.info.error && res.info.token) {
                dbg(`resolved ${candidate}`)
                return res
            }
        }
        debug(`no candidates resolved`)
        return {
            info: {
                model: "?",
                error: hint
                    ? `LLM provider not configured or refresh token expired for '${hint}'`
                    : "LLM provider not configured or refresh token expired",
            },
        }
    }
}
