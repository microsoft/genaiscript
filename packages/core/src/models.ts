import { ChatCompletionHandler } from "./chat"
import { OpenAIChatCompletion } from "./openai"

export function resolveChatCompletion(
    model: string,
    options?: {
        getChatCompletions?: ChatCompletionHandler
        modelApiType?: "openai"
    }
): { completer: ChatCompletionHandler; modelApiType?: "openai" } {
    if (options?.getChatCompletions)
        return {
            completer: options?.getChatCompletions,
            modelApiType: options?.modelApiType,
        }

    return { completer: OpenAIChatCompletion, modelApiType: "openai" }
}
