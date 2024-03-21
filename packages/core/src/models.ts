import { AICIModel } from "./aici"
import { LanguageModel } from "./chat"
import { OpenAIModel } from "./openai"

export function resolveLanguageModel(
    family: "openai" | "aici",
    options?: {
        languageModel?: LanguageModel
    }
): LanguageModel {
    if (options?.languageModel) return options?.languageModel
    if (family === "aici") return AICIModel
    return OpenAIModel
}
