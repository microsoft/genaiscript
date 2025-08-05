"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.mcpRequestSample = mcpRequestSample;
const types_js_1 = require("@modelcontextprotocol/sdk/types.js");
const cleaners_js_1 = require("./cleaners.js");
const constants_js_1 = require("./constants.js");
const debug_js_1 = require("./debug.js");
const models_js_1 = require("./models.js");
const cancellation_js_1 = require("./cancellation.js");
const dbgs = (0, debug_js_1.genaiscriptDebug)("mcp:server:sampling");
async function mcpRequestSample(server, req, options) {
    // Implement the completer logic here
    dbgs(`sampling ${req.model}`);
    const { trace, cancellationToken } = options ?? {};
    const { model } = (0, models_js_1.parseModelIdentifier)(req.model);
    const signal = (0, cancellation_js_1.toSignal)(cancellationToken);
    const maxTokens = req.max_completion_tokens;
    const systemMessages = req.messages.filter(({ role }) => role === "system");
    const systemPrompt = systemMessages.map(({ content }) => content).join(constants_js_1.SYSTEM_FENCE);
    const otherMessages = req.messages.filter(({ role }) => role !== "system");
    const body = (0, cleaners_js_1.deleteUndefinedValues)({
        method: "sampling/createMessage",
        params: (0, cleaners_js_1.deleteUndefinedValues)({
            messages: otherMessages,
            temperature: req.temperature,
            metadata: req.metadata,
            modelPreferences: {
                hints: [
                    {
                        name: model,
                    },
                ].filter(({ name }) => !!name),
                intelligencePriority: 0.8,
                speedPriority: 0.5,
            },
            systemPrompt,
            maxTokens,
            signal,
        }),
    });
    trace?.detailsFenced(`🧪 mcp sampling`, body, "json");
    let responseSoFar = "";
    const res = await server.request(body, types_js_1.CreateMessageResultSchema, {
        onprogress: (data) => {
            dbgs(`%d/%d %s`, data.progress, data.total, data.message);
            responseSoFar += data.message;
        },
    });
    dbgs(`sampling result: %O`, res);
    trace?.detailsFenced(`🧪 sampling result`, res, "json");
    // "endTurn", "stopSequence", "maxTokens"
    const finishReason = {
        ["endTurn"]: "stop",
        ["stopSequence"]: "stop",
        ["maxTokens"]: "length",
    }[res.stopReason] ?? "stop";
    const response = {
        model: res.model,
        text: res.content?.type === "text" ? res.content.text : "",
        finishReason,
    };
    dbgs(`response: %O`, response);
    return response;
}
//# sourceMappingURL=mcpsampling.js.map