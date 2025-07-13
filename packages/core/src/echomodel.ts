// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import type { LanguageModel } from "./chat.js";
import { renderMessagesToMarkdown } from "./chatrender.js";
import { deleteEmptyValues } from "./cleaners.js";
import { MODEL_PROVIDER_ECHO } from "./constants.js";

export const EchoModel = Object.freeze<LanguageModel>({
  id: MODEL_PROVIDER_ECHO,
  completer: async (req, connection, options) => {
    const { messages, model, ...rest } = req;
    const { partialCb, inner } = options;
    const text = `## Messages
        
${await renderMessagesToMarkdown(messages, {
  textLang: "markdown",
  assistant: true,
  system: true,
  user: true,
})}

## Request

\`\`\`json
${JSON.stringify(deleteEmptyValues({ messages, ...rest }), null, 2)}
\`\`\`
`;
    partialCb?.({
      responseChunk: text,
      tokensSoFar: 0,
      responseSoFar: text,
      inner,
    });

    return {
      finishReason: "stop",
      text,
    };
  },
});
