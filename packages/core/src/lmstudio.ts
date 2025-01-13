import { LanguageModel, PullModelFunction } from "./chat"
import { MODEL_PROVIDER_LMSTUDIO, SUCCESS_ERROR_CODE } from "./constants"
import { host, runtimeHost } from "./host"
import { parseModelIdentifier } from "./models"
import { OpenAIChatCompletion, OpenAIListModels } from "./openai"
import { execa } from "execa"
import { logVerbose, utf8Decode } from "./util"

const pullModel: PullModelFunction = async (cfg, options) => {
    const model = cfg.model
    const models = await OpenAIListModels(cfg, options)
    if (models.find((m) => m.id === model)) return { ok: true }
    logVerbose(`lms get ${model} --yes`)
    const res = await execa({ stdout: ["inherit"] })`lms get ${model} --yes`
    return {
        ok: res.exitCode === SUCCESS_ERROR_CODE,
    }
}

// Define the Ollama model with its completion handler and model listing function
export const LMStudioModel = Object.freeze<LanguageModel>({
    id: MODEL_PROVIDER_LMSTUDIO,
    completer: OpenAIChatCompletion,
    listModels: OpenAIListModels,
    pullModel,
})
