// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { CreateMessageResultSchema } from "@modelcontextprotocol/sdk/types.js";
import type { LanguageModel } from "./chat.js";
import type {
  ChatCompletionResponse,
  ChatCompletionsOptions,
  CreateChatCompletionRequest,
} from "./chattypes.js";
import { deleteUndefinedValues } from "./cleaners.js";
import { MODEL_PROVIDER_MCP, SYSTEM_FENCE } from "./constants.js";
import { genaiscriptDebug } from "./debug.js";
import { parseModelIdentifier } from "./models.js";
import type { LanguageModelConfiguration } from "./server/messages.js";
import type { MarkdownTrace } from "./trace.js";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
const dbgs = genaiscriptDebug("mcp:server:sampling");

export function mcpCreateLanguageModel(server: Server): LanguageModel {
  return Object.freeze<LanguageModel>({
    id: MODEL_PROVIDER_MCP,
    completer: async (
      req: CreateChatCompletionRequest,
      connection: LanguageModelConfiguration,
      completerOptions: ChatCompletionsOptions,
      trace: MarkdownTrace,
    ): Promise<ChatCompletionResponse> => {
      // Implement the completer logic here
      dbgs(`sampling ${req.model}`);
      const { model } = parseModelIdentifier(req.model);
      const { partialCb, inner } = completerOptions || {};

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
        }),
      });

      trace.detailsFenced(`🧪 mcp sampling`, body, "json");

      let responseSoFar = "";
      const res = await server.request(body, CreateMessageResultSchema, {
        onprogress: (data) => {
          dbgs(`%d/%d %s`, data.progress, data.total, data.message);
          responseSoFar += data.message;
          partialCb?.({
            responseSoFar,
            responseChunk: data.message,
            tokensSoFar: data.progress,
            inner,
          });
        },
      });

      trace.detailsFenced(`🧪 sampling result`, res, "json");
      // "endTurn", "stopSequence", "maxTokens"
      const finishReason: "stop" | "length" | "fail" =
        {
          ["endTurn"]: "stop",
          ["stopSequence"]: "stop",
          ["maxTokens"]: "length",
        }[res.stopReason] ?? ("fail" as any);
      return {
        model: res.model,
        text: res.content?.type === "text" ? res.content.text : "",
        finishReason,
      } satisfies ChatCompletionResponse;
    },
  } satisfies LanguageModel);
}
