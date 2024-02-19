import { ChatCompletionRequestMessage } from "./chat"
import type { ChatCompletionTool } from "openai/resources"
import { encodeChat } from "gpt-tokenizer"

export function estimateTokens(
    model: string,
    messages: ChatCompletionRequestMessage[],
    tools: ChatCompletionTool[]
): number {
    const chat: { role: "user" | "system" | "assistant"; content: string }[] =
        messages.filter(
            ({ role }) =>
                role === "user" || role === "system" || role === "assistant"
        ) as any
    const chatTokens = encodeChat(chat, model as any)

    return chatTokens.length
}
