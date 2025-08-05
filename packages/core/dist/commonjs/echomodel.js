"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.EchoModel = void 0;
const chatrender_js_1 = require("./chatrender.js");
const cleaners_js_1 = require("./cleaners.js");
const constants_js_1 = require("./constants.js");
exports.EchoModel = Object.freeze({
    id: constants_js_1.MODEL_PROVIDER_ECHO,
    completer: async (req, connection, options) => {
        const { messages, model, ...rest } = req;
        const { partialCb, inner } = options;
        const text = `## Messages
        
${await (0, chatrender_js_1.renderMessagesToMarkdown)(messages, {
            textLang: "markdown",
            assistant: true,
            system: true,
            user: true,
        })}

## Request

\`\`\`json
${JSON.stringify((0, cleaners_js_1.deleteEmptyValues)({ messages, ...rest }), null, 2)}
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
//# sourceMappingURL=echomodel.js.map