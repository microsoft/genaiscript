import { ChatCompletionRequestMessage } from "./chat"
import type { ChatCompletionTool } from "openai/resources"
import { encodeChat, encode } from "gpt-tokenizer"
import { logError } from "./util"

export function estimateTokens(model: string, text: string) {
    return estimateChatTokens(model, [
        {
            role: "user",
            content: text,
        },
    ])
}

export function estimateChatTokens(
    model: string,
    messages: ChatCompletionRequestMessage[],
    tools?: ChatCompletionTool[]
): number {
    const chat: { role: "user" | "system" | "assistant"; content: string }[] =
        messages.filter(
            ({ role }) =>
                role === "user" || role === "system" || role === "assistant"
        ) as any
    try {
        const chatTokens = encodeChat(chat, model as any)
        return chatTokens.length
    } catch (e) {
        logError(e.message)
        return 0
    }
}
