import { LanguageModel, LanguageModelInfo } from "./chat"
import { MODEL_PROVIDER_GOOGLE } from "./constants"
import { LanguageModelConfiguration } from "./host"
import { OpenAIChatCompletion } from "./openai"

async function listModels(
    _: LanguageModelConfiguration
): Promise<LanguageModelInfo[]> {
    
}

export const GoogleModel = Object.freeze<LanguageModel>({
    completer: OpenAIChatCompletion,
    id: MODEL_PROVIDER_GOOGLE,
    listModels,
})
