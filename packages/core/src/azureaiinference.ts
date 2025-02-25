import { LanguageModel } from "./chat"
import { MODEL_PROVIDER_AZURE_AI_INFERENCE } from "./constants"
import { OpenAIChatCompletion } from "./openai"

// Define the Ollama model with its completion handler and model listing function
export const AzureAIInferenceModel = Object.freeze<LanguageModel>({
    id: MODEL_PROVIDER_AZURE_AI_INFERENCE,
    completer: OpenAIChatCompletion,
    listModels: async () => {
        return {
            ok: true,
            models: [
                {
                    id: "gpt-4o",
                },
                {
                    id: "gpt-4o-mini",
                },
                {
                    id: "o1",
                },
                {
                    id: "o1-preview",
                },
                {
                    id: "o3-mini",
                },
            ],
        }
    },
})
