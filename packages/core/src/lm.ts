import { AICIModel } from "./aici"
import { LanguageModel } from "./chat"
import { MODEL_PROVIDER_AICI, MODEL_PROVIDER_OLLAMA } from "./constants"
import { LanguageModelConfiguration } from "./host"
import { OllamaModel } from "./ollama"
import { OpenAIModel } from "./openai"
import { parseModelIdentifier } from "./models"

export function resolveLanguageModel(
    options: {
        model?: string
        languageModel?: LanguageModel
    },
    configuration: LanguageModelConfiguration
): LanguageModel {
    const { model, languageModel } = options || {}
    if (languageModel) return languageModel

    const { provider } = parseModelIdentifier(model)
    if (provider === MODEL_PROVIDER_OLLAMA) return OllamaModel
    if (provider === MODEL_PROVIDER_AICI) return AICIModel
    return OpenAIModel
}
