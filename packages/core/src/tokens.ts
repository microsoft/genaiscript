import { ChatCompletionRequestMessage } from "./chat"
import type { ChatCompletionTool } from "openai/resources"
import { installImport } from "./import"
import { MarkdownTrace } from "./trace"

async function tryImportGPTTokens(trace?: MarkdownTrace) {
    try {
        const module = await import("gpt-tokens")
        return module
    } catch (e) {
        trace?.error("gpt-tokens not found, installing...")
        await installImport("gpt-tokens", trace)
        const module = await import("gpt-tokens")
        return module
    }
}

export async function estimateTokens(
    model: string,
    messages: ChatCompletionRequestMessage[],
    tools: ChatCompletionTool[]
): Promise<{ tokens: number }> {
    try {
        const { GPTTokens } = await tryImportGPTTokens()
        const usageInfo = new GPTTokens({
            model: model as any,
            messages: messages.filter(
                ({ role, content }) =>
                    typeof content === "string" &&
                    (role === "user" ||
                        role === "assistant" ||
                        role === "system")
            ) as any,
            tools: tools as any,
        })

        return {
            tokens: usageInfo.usedTokens,
        }
    } catch (e) {
        return undefined
    }
}
