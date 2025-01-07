import { Transform } from "stream"
import { AICIModel } from "./aici"
import { AnthropicBedrockModel, AnthropicModel } from "./anthropic"
import { LanguageModel } from "./chat"
import {
    MODEL_PROVIDER_AICI,
    MODEL_PROVIDER_ANTHROPIC,
    MODEL_PROVIDER_ANTHROPIC_BEDROCK,
    MODEL_PROVIDER_CLIENT,
    MODEL_PROVIDER_GITHUB,
    MODEL_PROVIDER_OLLAMA,
    MODEL_PROVIDER_TRANSFORMERS,
    MODEL_PROVIDERS,
} from "./constants"
import { host } from "./host"
import { OllamaModel } from "./ollama"
import { LocalOpenAICompatibleModel } from "./openai"
import { TransformersModel } from "./transformers"
import { GitHubModel } from "./github"

export function resolveLanguageModel(provider: string): LanguageModel {
    if (provider === MODEL_PROVIDER_CLIENT) {
        const m = host.clientLanguageModel
        if (!m) throw new Error("Client language model not available")
        return m
    }
    if (provider === MODEL_PROVIDER_GITHUB) return GitHubModel
    if (provider === MODEL_PROVIDER_OLLAMA) return OllamaModel
    if (provider === MODEL_PROVIDER_AICI) return AICIModel
    if (provider === MODEL_PROVIDER_ANTHROPIC) return AnthropicModel
    if (provider === MODEL_PROVIDER_ANTHROPIC_BEDROCK)
        return AnthropicBedrockModel
    if (provider === MODEL_PROVIDER_TRANSFORMERS) return TransformersModel

    const features = MODEL_PROVIDERS.find((p) => p.id === provider)
    return LocalOpenAICompatibleModel(provider, {
        listModels: features?.listModels !== false,
        pullModel: features?.pullModel,
    })
}
