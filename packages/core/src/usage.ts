import {
    ChatCompletionMessageParam,
    ChatCompletionUsage,
    CreateChatCompletionRequest,
} from "./chattypes"
import { MarkdownTrace } from "./trace"
import { logVerbose, logWarn } from "./util"
// import pricing.json and assert json
import pricings from "./pricing.json" // Interface to hold statistics related to the generation process
import { parseModelIdentifier } from "./models"
import {
    MODEL_PROVIDER_AICI,
    MODEL_PROVIDER_GITHUB,
    MODEL_PROVIDER_OPENAI,
} from "./constants"

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

export function renderCost(value: number) {
    if (isNaN(value)) return ""
    return value <= 0.01
        ? `${(value * 100).toFixed(3)}¢`
        : value <= 0.1
          ? `${(value * 100).toFixed(2)}¢`
          : `${value.toFixed(2)}$`
}

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

    cost(): number {
        return [
            estimateCost(this.model, this.usage),
            ...this.children.map((c) => c.cost()),
        ].reduce((a, b) => (a ?? 0) + (b ?? 0), 0)
    }

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

    createChild(model: string, label?: string) {
        const child = new GenerationStats(model, label)
        this.children.push(child)
        return child
    }

    trace(trace: MarkdownTrace) {
        trace.startDetails("📊 generation stats")
        try {
            this.traceStats(trace)
        } finally {
            trace.endDetails()
        }
    }

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

    log() {
        this.logTokens("")
    }

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
