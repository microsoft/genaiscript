import { ChatCompletionMessageParam } from "./chat"
import {
    ChatCompletionContentPartText,
    type ChatCompletionTool,
} from "openai/resources"
import { encodeChat, encode } from "gpt-tokenizer"
import { logError } from "./util"

export function estimateTokens(model: string, text: string) {
    if (!text?.length) return 0
    try {
        return encode(text).length
    } catch (e) {
        logError(e)
        return text.length >> 2
    }
}

export function estimateChatTokens(
    model: string,
    messages: ChatCompletionMessageParam[],
    tools?: ChatCompletionTool[]
): number {
    try {
        const chat: {
            role: "user" | "system" | "assistant"
            content: string
        }[] = messages
            .filter(
                ({ role }) =>
                    role === "user" || role === "system" || role === "assistant"
            )
            .map(({ role, content }) => ({
                role: role as "user" | "system" | "assistant",
                content:
                    typeof content === "string"
                        ? content
                        : content
                              .filter(({ type }) => type === "text")
                              .map(
                                  (c) =>
                                      (c as ChatCompletionContentPartText).text
                              )
                              .join("\n"),
            }))
        const chatTokens = encodeChat(chat, model as any)
        return chatTokens.length | 0
    } catch (e) {
        logError(e)
        return JSON.stringify(messages).length >> 2
    }
}
