import { ChatCompletionRequestMessage } from "./chat"
import type { ChatCompletionTool } from "openai/resources"
import { encodeChat, encode } from "gpt-tokenizer"
import { logError } from "./util"

export function estimateTokens(model: string, text: string) {
    if (!text?.length) return 0
    try {
        return encode(text).length
    } catch (e) {
        logError(e.message)
        return text.length / 4
    }
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
        return JSON.stringify(chat).length / 4
    }
}
