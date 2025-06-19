import { LanguageModel } from "./chat";
import { renderMessagesToMarkdown } from "./chatrender";
import { deleteEmptyValues } from "./cleaners";
import { MODEL_PROVIDER_ECHO } from "./constants";

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
