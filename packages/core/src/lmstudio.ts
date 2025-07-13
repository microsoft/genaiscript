// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { LanguageModel, PullModelFunction } from "./chat.js";
import { MODEL_PROVIDER_LMSTUDIO, SUCCESS_ERROR_CODE } from "./constants.js";
import { OpenAIChatCompletion, OpenAIEmbedder, OpenAIListModels } from "./openai.js";
import { logVerbose } from "./util.js";
import { runtimeHost } from "./host.js";

const pullModel: PullModelFunction = async (cfg, _options) => {
  const model = cfg.model;
  logVerbose(`lms get ${model} --yes`);
  const res = await runtimeHost.exec(undefined, `lms`, [`get`, model, `--yes`], _options);
  return {
    ok: res.exitCode === SUCCESS_ERROR_CODE,
  };
};

// Define the Ollama model with its completion handler and model listing function
export const LMStudioModel = Object.freeze<LanguageModel>({
  id: MODEL_PROVIDER_LMSTUDIO,
  completer: OpenAIChatCompletion,
  listModels: OpenAIListModels,
  pullModel,
  embedder: OpenAIEmbedder,
});
