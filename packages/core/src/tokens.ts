import { ChatCompletionRequestMessage } from "./chat"
import type { ChatCompletionTool } from "openai/resources"
import { promptTokensEstimate } from "openai-chat-tokens"

export function estimateTokens(
    model: string,
    messages: ChatCompletionRequestMessage[],
    tools: ChatCompletionTool[]
): number {
    const res = promptTokensEstimate({ messages })
    return res
}
