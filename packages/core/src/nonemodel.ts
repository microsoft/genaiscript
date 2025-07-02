// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { LanguageModel } from "./chat.js";
import { MODEL_PROVIDER_NONE } from "./constants.js";
import { serializeError } from "./error.js";

export const NoneModel = Object.freeze<LanguageModel>({
  id: MODEL_PROVIDER_NONE,
  completer: async (_req, _connection, _options) => {
    return {
      finishReason: "fail",
      error: serializeError("No LLM execution allowed in this context."),
    };
  },
});
