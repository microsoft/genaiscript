import { AICIModel } from "./aici"
import { AnthropicModel } from "./anthropic"
import { LanguageModel } from "./chat"
import {
    MODEL_PROVIDER_AICI,
    MODEL_PROVIDER_ANTHROPIC,
    MODEL_PROVIDER_CLIENT,
    MODEL_PROVIDER_OLLAMA,
} from "./constants"
import { host } from "./host"
import { OllamaModel } from "./ollama"
import { OpenAIModel } from "./openai"

export function resolveLanguageModel(provider: string): LanguageModel {
    if (provider === MODEL_PROVIDER_CLIENT) {
        const m = host.clientLanguageModel
        if (!m) throw new Error("Client language model not available")
        return m
    }
    if (provider === MODEL_PROVIDER_OLLAMA) return OllamaModel
    if (provider === MODEL_PROVIDER_AICI) return AICIModel
    if (provider === MODEL_PROVIDER_ANTHROPIC) return AnthropicModel
    return OpenAIModel
}
