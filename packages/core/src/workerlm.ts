// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { parentPort } from "node:worker_threads";
import type { LanguageModel } from "./chat.js";
import type {
  ChatCompletionResponse,
  ChatCompletionsOptions,
  CreateChatCompletionRequest,
} from "./chattypes.js";
import type { LanguageModelConfiguration } from "./server/messages.js";
import type { MarkdownTrace } from "./trace.js";
import { generateId } from "./id.js";
import { genaiscriptDebug } from "./debug.js";
import type { SerializedError } from "./types.js";
const dbg = genaiscriptDebug("worker:lm");

export interface ChatCompletionRequestMessage {
  type: "chatCompletion";
  id: string;
  request: CreateChatCompletionRequest;
}

export interface ChatCompletionResponseMessage {
  type: "chatCompletion";
  id: string;
  response?: ChatCompletionResponse;
  error?: SerializedError;
}

export function createWorkerLanguageModel() {
  if (!parentPort) throw new Error("This function must be called in a worker thread");
  return Object.freeze<LanguageModel>({
    id: "worker",
    completer: async (
      request: CreateChatCompletionRequest,
      connection: LanguageModelConfiguration,
      completerOptions: ChatCompletionsOptions,
      trace: MarkdownTrace,
    ): Promise<ChatCompletionResponse> => {
      const id = generateId();
      dbg(`request %s`, id);
      return new Promise<ChatCompletionResponse>((resolve, reject) => {
        // eslint-disable-next-line n/no-unsupported-features/node-builtins
        const handler = (ev: any) => {
          dbg(`%O`, ev);
          const { detail } = ev as { detail: ChatCompletionResponseMessage };
          if (detail?.type !== "chatCompletion" || detail?.id !== id) {
            return;
          }
          dbg(`response %s`, id);
          const { response: result, error } = detail;
          if (error) {
            reject(error.message);
          } else if (!result) {
            reject("No result returned from worker");
          } else resolve(result);
        };
        parentPort.addEventListener("message", handler, { once: true });
        parentPort.postMessage({
          type: "chatCompletion",
          id,
          request,
        } satisfies ChatCompletionRequestMessage);
      });
    },
  });
}
