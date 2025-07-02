// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { LanguageModel } from "./chat.js";
import { MODEL_PROVIDER_AZURE_AI_INFERENCE } from "./constants.js";
import { OpenAIChatCompletion, OpenAIEmbedder } from "./openai.js";

export const AzureAIInferenceModel = Object.freeze<LanguageModel>({
  id: MODEL_PROVIDER_AZURE_AI_INFERENCE,
  completer: OpenAIChatCompletion,
  embedder: OpenAIEmbedder,
  listModels: async () => {
    return {
      ok: true,
      models: [
        {
          id: "o3",
        },
        {
          id: "o3-mini",
        },
        {
          id: "o4-mini",
        },
        {
          id: "gpt-4.1",
        },
        {
          id: "gpt-4.1-mini",
        },
        {
          id: "gpt-4.1-nano",
        },
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
    };
  },
});
