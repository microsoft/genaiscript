import { LanguageModel, PullModelFunction } from "./chat"
import { MODEL_PROVIDER_LMSTUDIO, SUCCESS_ERROR_CODE } from "./constants"
import { OpenAIChatCompletion, OpenAIListModels } from "./openai"
import { execa } from "execa"
import { logVerbose } from "./util"

const pullModel: PullModelFunction = async (cfg, options) => {
    const model = cfg.model
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
