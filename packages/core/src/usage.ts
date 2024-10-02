import { ChatCompletionUsage } from "./chattypes"
import { MarkdownTrace } from "./trace"
import { logVerbose, logWarn } from "./util"

// Interface to hold statistics related to the generation process
export class GenerationStats {
    toolCalls = 0 // Number of tool invocations
    repairs = 0 // Number of repairs made
    turns = 0 // Number of turns in the interaction
    readonly usage: ChatCompletionUsage
    readonly children: GenerationStats[] = []

    constructor(
        public readonly model: string,
        public readonly label?: string
    ) {
        this.usage = {
            completion_tokens: 0,
            prompt_tokens: 0,
            total_tokens: 0,
        }
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
        if (this.toolCalls) trace.itemValue("tool calls", this.toolCalls)
        if (this.repairs) trace.itemValue("repairs", this.repairs)
        if (this.turns) trace.itemValue("turns", this.turns)
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
        if (this.model || this.usage.total_tokens)
            logVerbose(
                `${indent}${this.model} ${this.label ? `(${this.label})` : ""} > ${this.usage.total_tokens} tokens (${this.usage.prompt_tokens} -> ${this.usage.completion_tokens})`
            )
        for (const child of this.children) child.logTokens(indent + "  ")
    }

    addUsage(model: string, usage: ChatCompletionUsage) {
        if (!usage) return
        if (this.model && model !== this.model)
            logWarn(`model mismatch: got ${model}, expected ${this.model}`)

        this.usage.completion_tokens += usage.completion_tokens ?? 0
        this.usage.prompt_tokens += usage.prompt_tokens ?? 0
        this.usage.total_tokens += usage.total_tokens ?? 0
    }
}
