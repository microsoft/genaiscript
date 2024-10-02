import { ChatCompletionUsage } from "./chattypes"
import { MarkdownTrace } from "./trace"
import { logVerbose } from "./util"

// Interface to hold statistics related to the generation process
export class GenerationStats {
    toolCalls = 0 // Number of tool invocations
    repairs = 0 // Number of repairs made
    turns = 0 // Number of turns in the interaction
    readonly usages: Record<string, ChatCompletionUsage>

    constructor() {
        this.usages = {}
    }

    trace(trace: MarkdownTrace) {
        trace.startDetails("📊 generation stats")
        try {
            trace.appendContent(
                CSV.markdownify(
                    Object.entries(this.usages).map(([model, v]) => ({
                        model,
                        prompt: v.prompt_tokens,
                        completion: v.completion_tokens,
                        total: v.total_tokens,
                    }))
                )
            )
            trace.itemValue("tool calls", this.toolCalls)
            trace.itemValue("repairs", this.repairs)
            trace.itemValue("turns", this.turns)
        } finally {
            trace.endDetails()
        }
    }

    log() {
        const usages = this.usages
        for (const [key, value] of Object.entries(usages)) {
            if (value.total_tokens > 0)
                logVerbose(
                    `tokens:  ${key}, ${value.total_tokens} (${value.prompt_tokens} => ${value.completion_tokens})`
                )
        }
    }

    addUsage(model: string, usage: ChatCompletionUsage) {
        if (!usage) return

        const usages = this.usages
        const u =
            usages[model] ??
            (usages[model] = <ChatCompletionUsage>{
                completion_tokens: 0,
                prompt_tokens: 0,
                total_tokens: 0,
            })
        u.completion_tokens += usage.completion_tokens ?? 0
        u.prompt_tokens += usage.prompt_tokens ?? 0
        u.total_tokens += usage.total_tokens ?? 0
    }

    merge(other: GenerationStats) {
        this.toolCalls += other.toolCalls
        this.repairs += other.repairs
        this.turns += other.turns
        for (const [model, usage] of Object.entries(other.usages)) {
            this.addUsage(model, usage)
        }
    }
}
