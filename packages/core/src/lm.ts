import { AICIModel } from "./aici"
import { AnthropicBedrockModel, AnthropicModel } from "./anthropic"
import { LanguageModel } from "./chat"
import {
    MODEL_PROVIDER_AICI,
    MODEL_PROVIDER_ANTHROPIC,
    MODEL_PROVIDER_ANTHROPIC_BEDROCK,
    MODEL_PROVIDER_GITHUB_COPILOT_CHAT,
    MODEL_PROVIDER_GITHUB,
    MODEL_PROVIDER_LMSTUDIO,
    MODEL_PROVIDER_OLLAMA,
    MODEL_PROVIDER_TRANSFORMERS,
    MODEL_PROVIDERS,
    MODEL_WHISPERASR_PROVIDER,
    MODEL_PROVIDER_AZURE_OPENAI,
} from "./constants"
import { runtimeHost } from "./host"
import { OllamaModel } from "./ollama"
import { LocalOpenAICompatibleModel } from "./openai"
import { TransformersModel } from "./transformers"
import { GitHubModel } from "./github"
import { LMStudioModel } from "./lmstudio"
import { WhiserAsrModel } from "./whisperasr"
import { AzureOpenAIModel } from "./azureopenai"

export function resolveLanguageModel(provider: string): LanguageModel {
    if (provider === MODEL_PROVIDER_GITHUB_COPILOT_CHAT) {
        const m = runtimeHost.clientLanguageModel
        if (!m) throw new Error("Github Copilot Chat Models not available")
        return m
    }
    if (provider === MODEL_PROVIDER_AZURE_OPENAI) return AzureOpenAIModel
    if (provider === MODEL_PROVIDER_GITHUB) return GitHubModel
    if (provider === MODEL_PROVIDER_OLLAMA) return OllamaModel
    if (provider === MODEL_PROVIDER_AICI) return AICIModel
    if (provider === MODEL_PROVIDER_ANTHROPIC) return AnthropicModel
    if (provider === MODEL_PROVIDER_ANTHROPIC_BEDROCK)
        return AnthropicBedrockModel
    if (provider === MODEL_PROVIDER_TRANSFORMERS) return TransformersModel
    if (provider === MODEL_PROVIDER_LMSTUDIO) return LMStudioModel
    if (provider === MODEL_WHISPERASR_PROVIDER) return WhiserAsrModel

    const features = MODEL_PROVIDERS.find((p) => p.id === provider)
    return LocalOpenAICompatibleModel(provider, {
        listModels: features?.listModels !== false,
        transcribe: features?.transcribe,
        speech: features?.speech,
    })
}
