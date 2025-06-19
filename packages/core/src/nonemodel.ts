import { LanguageModel } from "./chat";
import { MODEL_PROVIDER_NONE } from "./constants";
import { serializeError } from "./error";

export const NoneModel = Object.freeze<LanguageModel>({
  id: MODEL_PROVIDER_NONE,
  completer: async (req, connection, options) => {
    return {
      finishReason: "fail",
      error: serializeError("No LLM execution allowed in this context."),
    };
  },
});
