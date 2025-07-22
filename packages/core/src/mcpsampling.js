// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { CreateMessageResultSchema } from "@modelcontextprotocol/sdk/types.js";
import { deleteUndefinedValues } from "./cleaners.js";
import { SYSTEM_FENCE } from "./constants.js";
import { genaiscriptDebug } from "./debug.js";
import { parseModelIdentifier } from "./models.js";
import { toSignal } from "./cancellation.js";
const dbgs = genaiscriptDebug("mcp:server:sampling");
export async function mcpRequestSample(server, req, options) {
    // Implement the completer logic here
    dbgs(`sampling ${req.model}`);
    const { trace, cancellationToken } = options ?? {};
    const { model } = parseModelIdentifier(req.model);
    const signal = toSignal(cancellationToken);
    const maxTokens = req.max_completion_tokens;
    const systemMessages = req.messages.filter(({ role }) => role === "system");
    const systemPrompt = systemMessages.map(({ content }) => content).join(SYSTEM_FENCE);
    const otherMessages = req.messages.filter(({ role }) => role !== "system");
    const body = deleteUndefinedValues({
        method: "sampling/createMessage",
        params: deleteUndefinedValues({
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
    const res = await server.request(body, CreateMessageResultSchema, {
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