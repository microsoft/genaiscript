import { LanguageModel } from "./chat"
import { OpenAIModel } from "./openai"

export function resolveLanguageModel(
    model: string,
    options?: {
        languageModel?: LanguageModel
    }
): LanguageModel {
    if (options?.languageModel) return options?.languageModel
    return OpenAIModel
}
