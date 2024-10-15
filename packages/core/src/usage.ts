/**
 * This module provides functionality for estimating costs and tracking usage statistics
 * related to chat completions, including generating detailed reports and logs.
 */

import {
    ChatCompletionMessageParam,
    ChatCompletionUsage,
    CreateChatCompletionRequest,
} from "./chattypes"
import { MarkdownTrace } from "./trace"
import { logVerbose, logWarn } from "./util"
import pricings from "./pricing.json" // Interface to hold statistics related to the generation process
import { parseModelIdentifier } from "./models"
import {
    MODEL_PROVIDER_AICI,
    MODEL_PROVIDER_GITHUB,
    MODEL_PROVIDER_OPENAI,
} from "./constants"

/**
 * Estimates the cost of a chat completion based on the model and usage.
 *
 * @param modelId - The identifier of the model used for chat completion.
 * @param usage - The usage statistics for the chat completion.
 * @returns The estimated cost or undefined if estimation is not possible.
 */
export function estimateCost(modelId: string, usage: ChatCompletionUsage) {
    if (!modelId || !usage.total_tokens) return undefined

    const { completion_tokens, prompt_tokens } = usage
    let { provider, model } = parseModelIdentifier(modelId)
    if (provider === MODEL_PROVIDER_AICI) return undefined
    else if (provider === MODEL_PROVIDER_GITHUB)
        provider = MODEL_PROVIDER_OPENAI
    const m = `${provider}:${model}`
    const cost = (pricings as any)[m] as {
        price_per_million_input_tokens: number
        price_per_million_output_tokens: number
        input_cache_token_rebate?: number
    }
    if (!cost) return undefined

    const {
        price_per_million_output_tokens,
        price_per_million_input_tokens,
        input_cache_token_rebate = 0.5,
    } = cost

    const cached = usage.prompt_tokens_details?.cached_tokens ?? 0
    const input =
        (prompt_tokens - cached) * price_per_million_input_tokens +
        cached * cost.price_per_million_input_tokens * input_cache_token_rebate
    const output = completion_tokens * price_per_million_output_tokens
    return (input + output) / 1e6
}

/**
 * Renders the cost as a string for display purposes.
 *
 * @param value - The cost to be rendered.
 * @returns A string representation of the cost.
 */
export function renderCost(value: number) {
    if (isNaN(value)) return ""
    if (value === 0) return `0$ (cached)`
    return value <= 0.01
        ? `${(value * 100).toFixed(3)}¢`
        : value <= 0.1
          ? `${(value * 100).toFixed(2)}¢`
          : `${value.toFixed(2)}$`
}

/**
 * Class to track and log generation statistics for chat completions.
 */
export class GenerationStats {
    public readonly model: string
    public readonly label?: string
    toolCalls = 0 // Number of tool invocations
    repairs = 0 // Number of repairs made
    turns = 0 // Number of turns in the interaction
    readonly usage: Required<ChatCompletionUsage>
    readonly children: GenerationStats[] = []

    private chatTurns: {
        messages: ChatCompletionMessageParam[]
        usage: ChatCompletionUsage
    }[] = []

    /**
     * Constructs a GenerationStats instance.
     *
     * @param model - The model used for chat completions.
     * @param label - Optional label for the statistics.
     */
    constructor(model: string, label?: string) {
        this.model = model
        this.label = label
        this.usage = {
            completion_tokens: 0,
            prompt_tokens: 0,
            total_tokens: 0,
            completion_tokens_details: {
                audio_tokens: 0,
                reasoning_tokens: 0,
            },
            prompt_tokens_details: {
                audio_tokens: 0,
                cached_tokens: 0,
            },
        }
    }

    /**
     * Calculates the total cost based on the usage statistics.
     *
     * @returns The total cost.
     */
    cost(): number {
        return [
            estimateCost(this.model, this.usage),
            ...this.children.map((c) => c.cost()),
        ].reduce((a, b) => (a ?? 0) + (b ?? 0), 0)
    }

    /**
     * Accumulates the usage statistics from this instance and its children.
     *
     * @returns The accumulated usage statistics.
     */
    accumulatedUsage(): ChatCompletionUsage {
        const res: ChatCompletionUsage = structuredClone(this.usage)
        for (const child of this.children) {
            const childUsage = child.accumulatedUsage()
            res.completion_tokens += childUsage.completion_tokens
            res.prompt_tokens += childUsage.prompt_tokens
            res.total_tokens += childUsage.total_tokens
            res.completion_tokens_details.audio_tokens +=
                childUsage.completion_tokens_details.audio_tokens
            res.completion_tokens_details.reasoning_tokens +=
                childUsage.completion_tokens_details.reasoning_tokens
            res.prompt_tokens_details.audio_tokens +=
                childUsage.prompt_tokens_details.audio_tokens
            res.prompt_tokens_details.cached_tokens +=
                childUsage.prompt_tokens_details.cached_tokens
        }
        return res
    }

    /**
     * Creates a new child GenerationStats instance.
     *
     * @param model - The model used for the child chat completions.
     * @param label - Optional label for the child's statistics.
     * @returns The created child GenerationStats instance.
     */
    createChild(model: string, label?: string) {
        const child = new GenerationStats(model, label)
        this.children.push(child)
        return child
    }

    /**
     * Traces the generation statistics using a MarkdownTrace instance.
     *
     * @param trace - The MarkdownTrace instance used for tracing.
     */
    trace(trace: MarkdownTrace) {
        trace.startDetails("📊 generation stats")
        try {
            this.traceStats(trace)
        } finally {
            trace.endDetails()
        }
    }

    /**
     * Helper method to trace individual statistics.
     *
     * @param trace - The MarkdownTrace instance used for tracing.
     */
    private traceStats(trace: MarkdownTrace) {
        trace.itemValue("prompt", this.usage.prompt_tokens)
        trace.itemValue("completion", this.usage.completion_tokens)
        trace.itemValue("tokens", this.usage.total_tokens)
        const c = renderCost(this.cost())
        if (c) trace.itemValue("cost", c)
        if (this.toolCalls) trace.itemValue("tool calls", this.toolCalls)
        if (this.repairs) trace.itemValue("repairs", this.repairs)
        if (this.turns) trace.itemValue("turns", this.turns)

        if (this.chatTurns.length > 1) {
            trace.startDetails("chat turns")
            try {
                for (const { messages, usage } of this.chatTurns) {
                    trace.item(
                        `${messages.length} messages, ${usage.total_tokens} tokens`
                    )
                }
            } finally {
                trace.endDetails()
            }
        }

        for (const child of this.children) {
            trace.startDetails(child.model)
            child.traceStats(trace)
            trace.endDetails()
        }
    }

    /**
     * Logs the generation statistics.
     */
    log() {
        this.logTokens("")
    }

    /**
     * Helper method to log tokens with indentation.
     *
     * @param indent - The indentation used for logging.
     */
    private logTokens(indent: string) {
        const c = this.cost()
        if (this.model || c) {
            const au = this.accumulatedUsage()
            logVerbose(
                `${indent}${this.label ? `${this.label} (${this.model})` : this.model}> ${au.total_tokens} tokens (${au.prompt_tokens} -> ${au.completion_tokens}) ${renderCost(c)}`
            )
        }
        if (this.chatTurns.length > 1)
            for (const { messages, usage } of this.chatTurns) {
                logVerbose(
                    `${indent}  ${messages.length} messages, ${usage.total_tokens} tokens ${renderCost(estimateCost(this.model, usage))}`
                )
            }
        for (const child of this.children) child.logTokens(indent + "  ")
    }

    /**
     * Adds usage statistics to the current instance.
     *
     * @param req - The request containing details about the chat completion.
     * @param usage - The usage statistics to be added.
     */
    addUsage(req: CreateChatCompletionRequest, usage: ChatCompletionUsage) {
        if (!usage) return
        const { model, messages } = req
        if (this.model && model !== this.model)
            logWarn(`model mismatch: got ${model}, expected ${this.model}`)

        this.usage.completion_tokens += usage.completion_tokens ?? 0
        this.usage.prompt_tokens += usage.prompt_tokens ?? 0
        this.usage.total_tokens += usage.total_tokens ?? 0

        this.usage.completion_tokens_details.audio_tokens +=
            usage.completion_tokens_details?.audio_tokens ?? 0
        this.usage.completion_tokens_details.reasoning_tokens +=
            usage.completion_tokens_details?.reasoning_tokens ?? 0
        this.usage.completion_tokens_details.audio_tokens +=
            usage.prompt_tokens_details?.audio_tokens ?? 0
        this.usage.completion_tokens_details.reasoning_tokens +=
            usage.prompt_tokens_details?.cached_tokens ?? 0

        const chatTurn = {
            messages: structuredClone(messages),
            usage: structuredClone(usage),
        }
        this.chatTurns.push(chatTurn)
    }
}
