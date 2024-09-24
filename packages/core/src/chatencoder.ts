import {
    ChatCompletionContentPart,
    ChatCompletionContentPartText,
    ChatCompletionMessageParam,
    ChatCompletionTool,
} from "./chattypes"
import { encodeChat } from "gpt-tokenizer"
import { logVerbose } from "./util"

/**
 * Estimates the number of tokens in chat messages for a given model.
 * Utilizes token encoding to provide an accurate count of tokens in text-based chat content.
 *
 * @param modelId - The identifier of the model being used.
 * @param messages - An array of chat messages containing roles and content.
 * @param tools - Optional array of tools used in chat completion.
 * @returns The estimated number of tokens or 0 if no valid messages are found.
 */
export function estimateChatTokens(
    modelId: string,
    messages: ChatCompletionMessageParam[],
    tools?: ChatCompletionTool[]
): number {
    // Return 0 if there are no messages provided
    if (!messages?.length) return 0
    try {
        // Check if any message content includes image URLs
        // Return undefined as images are not supported for token encoding
        if (
            messages.find(
                (msg) =>
                    msg.content !== "string" &&
                    Array.isArray(msg.content) &&
                    (msg.content as ChatCompletionContentPart[])?.find(
                        (part) => part.type === "image_url"
                    )
            )
        )
            return undefined

        // Transform the messages into a format suitable for the token encoder
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
                        ? content // Use the string content directly
                        : content // Filter and join text parts if content is structured
                              ?.filter(({ type }) => type === "text")
                              .map(
                                  (c) =>
                                      (c as ChatCompletionContentPartText).text
                              )
                              .join("\n"), // Join with newline for readability
            }))
            .filter(({ content }) => !!content?.length) // Remove entries with empty content

        // Encode the chat messages and count the number of tokens
        const chatTokens = encodeChat(chat, "gpt-4")
        return chatTokens.length | 0 // Bitwise OR with 0 ensures integer return
    } catch (e) {
        // Log any errors encountered during processing
        logVerbose(e)
        // Fallback: Estimate token count based on JSON string length
        return (JSON.stringify(messages).length / 3) | 0
    }
}
