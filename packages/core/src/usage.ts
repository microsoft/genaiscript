/**
 * This module provides functionality for estimating costs and tracking usage statistics
 * related to chat completions, including generating detailed reports and logs.
 */

import {
    ChatCompletionMessageParam,
    ChatCompletionResponse,
    ChatCompletionUsage,
    CreateChatCompletionRequest,
} from "./chattypes"
import { MarkdownTrace } from "./trace"
import { logVerbose, toStringList } from "./util"
import { parseModelIdentifier } from "./models"
import {
    BOX_RIGHT,
    BOX_UP_AND_RIGHT,
    CHAR_ENVELOPE,
    CHAR_FLOPPY_DISK,
    CHAR_UP_DOWN_ARROWS,
    MODEL_PRICINGS,
} from "./constants"
import {
    prettyCost,
    prettyTokensPerSecond,
    prettyDuration,
    prettyTokens,
} from "./pretty"
import { genaiscriptDebug } from "./debug"
import { ImageGenerationUsage } from "./chat"
const dbg = genaiscriptDebug("usage")

/**
 * Estimates the cost of a chat completion based on model pricing and token usage.
 *
 * @param modelId - The identifier of the model used for chat completion.
 * @param usage - The token usage statistics, including prompt, completion, and cached tokens.
 * @returns The estimated cost, or undefined if pricing data is unavailable. The cost is calculated using input and output token prices, with a rebate applied to cached tokens. If the model's pricing data cannot be determined, the function returns undefined.
 */
export function estimateCost(modelId: string, usage: ChatCompletionUsage) {
    if (!modelId || !usage.total_tokens) return undefined

    const { completion_tokens, prompt_tokens } = usage
    let { provider, model } = parseModelIdentifier(modelId)
    let mid = `${provider}:${model}`.toLowerCase()
    let cost = MODEL_PRICINGS[mid]
    if (!cost) {
        const m = model.match(
            /^gpt-(3\.5|4|4o|o1|o3|o4|o4-mini|o1-mini|o1-preview|4o-mini|o3-mini|4\.1|4\.1-mini|4\.1-nano)/
        )
        if (m) {
            model = m[0]
            mid = `${provider}:${model}`.toLowerCase()
            cost = MODEL_PRICINGS[mid]
        }
    }
    dbg(`pricing: %s <- %s %o`, mid, modelId, cost)
    if (!cost) {
        return undefined
    }

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
    return (input + output) / 1000000
}

export function estimateImageCost(
    modelId: string,
    usage: ImageGenerationUsage
) {
    if (!modelId || !usage?.total_tokens) return undefined

    const { provider, model } = parseModelIdentifier(modelId)
    const mid = `${provider}:${model}`.toLowerCase()
    const cost = MODEL_PRICINGS[mid]
    if (!cost) {
        return undefined
    }

    const { price_per_million_input_tokens, price_per_million_output_tokens } =
        cost
    const output =
        (usage.input_tokens ?? 0) * price_per_million_input_tokens +
        (usage.output_tokens ?? 0) * price_per_million_output_tokens
    return output / 1000000
}

/**
 * Determines if the specified model has associated pricing data by checking
 * if any pricing entries start with the provider's prefix.
 *
 * @param model - The identifier of the model to check.
 * @returns True if the model has pricing data available, otherwise false.
 */
export function isCosteable(model: string): boolean {
    const { provider } = parseModelIdentifier(model)
    const prefix = `${provider}:`
    return Object.keys(MODEL_PRICINGS).some((k) => k.startsWith(prefix))
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
        model: string
        cached: boolean
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
            duration: 0,
            completion_tokens: 0,
            prompt_tokens: 0,
            total_tokens: 0,
            completion_tokens_details: {
                audio_tokens: 0,
                reasoning_tokens: 0,
                accepted_prediction_tokens: 0,
                rejected_prediction_tokens: 0,
            },
            prompt_tokens_details: {
                audio_tokens: 0,
                cached_tokens: 0,
            },
        }
    }

    get resolvedModel() {
        return this.chatTurns?.[0]?.model || this.model
    }

    /**
     * Calculates the total cost based on the usage statistics.
     *
     * @returns The total cost.
     */
    cost(): number {
        return [
            ...this.chatTurns
                .filter((c) => !c.cached)
                .map(
                    ({ usage, model }) =>
                        estimateCost(model, usage) ??
                        estimateCost(this.model, usage)
                ),
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
            res.duration += childUsage.duration
            res.completion_tokens += childUsage.completion_tokens
            res.prompt_tokens += childUsage.prompt_tokens
            res.total_tokens += childUsage.total_tokens
            res.completion_tokens_details.accepted_prediction_tokens +=
                childUsage.completion_tokens_details
                    .accepted_prediction_tokens ?? 0
            res.completion_tokens_details.rejected_prediction_tokens +=
                childUsage.completion_tokens_details
                    .rejected_prediction_tokens ?? 0
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
        trace.startDetails("🪙 usage")
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
        const c = prettyCost(this.cost())
        if (c) trace.itemValue("cost", c)
        const ts = prettyTokensPerSecond(this.usage)
        if (ts) trace.itemValue("t/s", ts)
        if (this.usage.duration)
            trace.itemValue("duration", this.usage.duration)
        if (this.toolCalls) trace.itemValue("tool calls", this.toolCalls)
        if (this.repairs) trace.itemValue("repairs", this.repairs)
        if (this.turns) trace.itemValue("turns", this.turns)
        if (this.usage.prompt_tokens_details?.cached_tokens)
            trace.itemValue(
                "cached tokens",
                this.usage.prompt_tokens_details.cached_tokens
            )
        if (this.usage.completion_tokens_details?.reasoning_tokens)
            trace.itemValue(
                "reasoning tokens",
                this.usage.completion_tokens_details.reasoning_tokens
            )
        if (this.usage.completion_tokens_details?.accepted_prediction_tokens)
            trace.itemValue(
                "accepted prediction tokens",
                this.usage.completion_tokens_details.accepted_prediction_tokens
            )
        if (this.usage.completion_tokens_details?.rejected_prediction_tokens)
            trace.itemValue(
                "rejected prediction tokens",
                this.usage.completion_tokens_details.rejected_prediction_tokens
            )
        if (this.chatTurns.length > 1) {
            trace.startDetails("chat turns")
            try {
                for (const { cached, messages, usage } of this.chatTurns) {
                    trace.item(
                        toStringList(
                            cached ? CHAR_FLOPPY_DISK : "",
                            `${CHAR_ENVELOPE} ${messages.length}`,
                            usage.total_tokens
                                ? `${prettyTokens(usage.total_tokens)}`
                                : undefined
                        )
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
        const unknowns = new Set<string>()
        const c = this.cost()
        const au = this.accumulatedUsage()

        if (au?.total_tokens > 0) {
            const stats = [
                this.children.length > 1
                    ? `${CHAR_UP_DOWN_ARROWS}${this.children.length}`
                    : undefined,
                prettyDuration(au.duration),
                prettyTokens(au.prompt_tokens, "prompt"),
                prettyTokens(au.completion_tokens, "completion"),
                prettyTokensPerSecond(au),
                prettyCost(c),
            ]
                .filter((n) => !!n)
                .join(" ")
            logVerbose(
                `${indent}${this.label ? `${this.label}:` : ""}${this.resolvedModel}> ${stats}`
            )
        }
        if (this.model && isNaN(c) && isCosteable(this.model))
            unknowns.add(this.model)
        if (this.chatTurns.length > 1) {
            const chatTurns = this.chatTurns.slice(0, 10)
            for (const {
                messages,
                usage,
                model: turnModel,
                cached,
            } of chatTurns.filter(
                ({ usage }) => usage.total_tokens !== undefined
            )) {
                const cost = estimateCost(this.model, usage)
                if (cost === undefined && isCosteable(turnModel))
                    unknowns.add(this.model)
                logVerbose(
                    `${indent}  ${cached ? CHAR_FLOPPY_DISK : ""}${toStringList(`${CHAR_ENVELOPE} ${messages.length}`, prettyTokens(usage.total_tokens), prettyCost(cost), prettyTokensPerSecond(usage))}`
                )
            }
            if (this.chatTurns.length > chatTurns.length)
                logVerbose(`${indent}  ...`)
        }
        const children = this.children.slice(0, 10)
        for (const child of children) child.logTokens(indent + "  ")
        if (this.children.length > children.length) logVerbose(`${indent}  ...`)
        if (unknowns.size)
            logVerbose(`missing pricing for ${[...unknowns].join(", ")}`)
    }

    addImageGenerationUsage(usage: ImageGenerationUsage, duration?: number) {
        this.usage.duration += duration ?? 0
        if (usage) {
            this.usage.completion_tokens += usage.output_tokens ?? 0
            this.usage.prompt_tokens += usage.input_tokens ?? 0
            this.usage.total_tokens += usage.total_tokens ?? 0
        }
    }

    addUsage(usage: ChatCompletionUsage, duration?: number) {
        this.usage.duration += duration ?? 0
        if (usage) {
            this.usage.completion_tokens += usage.completion_tokens ?? 0
            this.usage.prompt_tokens += usage.prompt_tokens ?? 0
            this.usage.total_tokens += usage.total_tokens ?? 0

            this.usage.completion_tokens_details.audio_tokens +=
                usage.completion_tokens_details?.audio_tokens ?? 0
            this.usage.completion_tokens_details.reasoning_tokens +=
                usage.completion_tokens_details?.reasoning_tokens ?? 0
            this.usage.completion_tokens_details.accepted_prediction_tokens +=
                usage.completion_tokens_details?.accepted_prediction_tokens ?? 0
            this.usage.completion_tokens_details.rejected_prediction_tokens +=
                usage.completion_tokens_details?.rejected_prediction_tokens ?? 0
        }
    }

    /**
     * Adds usage statistics to the current instance.
     *
     * @param req - The request containing details about the chat completion.
     * @param usage - The usage statistics to be added.
     */
    addRequestUsage(
        modelId: string,
        req: CreateChatCompletionRequest,
        resp: ChatCompletionResponse
    ) {
        const {
            usage = { completion_tokens: 0, prompt_tokens: 0, total_tokens: 0 },
            model,
            cached,
            duration,
        } = resp
        const { messages } = req

        const cost = estimateCost(modelId, usage)
        logVerbose(
            `${BOX_UP_AND_RIGHT}${BOX_RIGHT}🏁 ${cached ? CHAR_FLOPPY_DISK : ""} ${modelId} ${CHAR_ENVELOPE} ${messages.length} ${[
                prettyDuration(duration),
                prettyTokens(usage.total_tokens, "both"),
                prettyTokens(usage.prompt_tokens, "prompt"),
                prettyTokens(usage.completion_tokens, "completion"),
                prettyTokensPerSecond(usage),
                prettyCost(cost),
            ]
                .filter((s) => !!s)
                .join(" ")}`
        )
        if (!cached) {
            this.addUsage(usage, duration)
        }

        const { provider } = parseModelIdentifier(this.model)
        const chatTurn = {
            messages: structuredClone(messages),
            usage: structuredClone(usage),
            model: `${provider}:${model}`,
            cached,
        }
        this.chatTurns.push(chatTurn)
    }
}
