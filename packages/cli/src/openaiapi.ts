// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { IncomingMessage, ServerResponse } from "http";
import type {
  CancellationOptions,
  ChatCompletion,
  ChatModel,
  ChatModels,
  CreateChatCompletionRequest,
  TraceOptions,
} from "@genaiscript/core";
import {
  LARGE_MODEL_ID,
  errorMessage,
  generateId,
  logError,
  logVerbose,
  resolveLanguageModel,
  resolveLanguageModelConfigurations,
  resolveModelConnectionInfo,
} from "@genaiscript/core";

async function readRequestBody<T>(req: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      resolve(JSON.parse(body) as T);
    });
    req.on("error", (err) => {
      reject(err);
    });
  });
}

function endError(res: ServerResponse<IncomingMessage>, statusCode: number, message: string) {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      error: {
        message,
      },
    }),
  );
}

/**
 * Handles incoming chat completion requests for the OpenAI-like API.
 *
 * @param req - The HTTP incoming request object.
 * @param res - The HTTP server response object.
 * @param options - Optional tracing and cancellation options.
 *
 * Processes the incoming request, validating the body and ensuring a valid model configuration is resolved.
 * Rejects requests with streaming enabled or missing a valid configuration. Communicates with a language model
 * to generate a chat completion. Returns the generated response or an appropriate error status in case of failures.
 * Handles cases where the request is canceled or fails, returning appropriate error codes.
 * Generates a fake OpenAI-like response with the chat completion results.
 */
export async function openaiApiChatCompletions(
  req: IncomingMessage,
  res: ServerResponse<IncomingMessage>,
  options?: TraceOptions & CancellationOptions,
): Promise<void> {
  const { trace, cancellationToken } = options || {};
  try {
    logVerbose(`chat/completions: post`);
    const body = await readRequestBody<CreateChatCompletionRequest>(req);
    if (!body) return endError(res, 400, `Invalid request body`);
    if (body.stream) return endError(res, 400, `Streaming not supported`);
    const connection = await resolveModelConnectionInfo(
      { model: body.model },
      { token: true, trace, defaultModel: LARGE_MODEL_ID },
    );
    if (connection.info.error) return endError(res, 403, errorMessage(connection.info.error));
    if (!connection.configuration) return endError(res, 403, `LLM configuration missing`);
    const { completer } = await resolveLanguageModel(connection.configuration.provider);
    body.model = connection.info.model;
    const resp = await completer(
      body,
      connection.configuration,
      { cancellationToken, inner: false },
      trace,
    );

    if (resp.finishReason === "cancel") return endError(res, 499, `Request cancelled`);
    if (resp.finishReason === "fail") return endError(res, 400, errorMessage(resp.error));

    // fake openai response
    const completion: ChatCompletion = {
      id: generateId(),
      object: "chat.completion",
      created: Date.now(),
      model: body.model,
      choices: [
        {
          index: 0,
          finish_reason: resp.finishReason,
          message: {
            role: "assistant",
            content: resp.text,
            refusal: undefined,
          },
          logprobs: resp.logprobs?.length
            ? {
                content: resp.logprobs,
                refusal: null,
              }
            : null,
        },
      ],
      usage: resp.usage,
    };
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(completion));
  } catch (e) {
    logError(errorMessage(e));
    logVerbose(e);
    endError(res, 500, `Internal server error`);
  }
}

/**
 * Handles the "models" API endpoint to list available language models from providers.
 *
 * @param req - The incoming HTTP request object.
 * @param res - The HTTP response object used to return the results.
 * @param options - Optional additional configurations for tracing and cancellation tokens.
 *   - cancellationToken - Token to cancel the operation if needed.
 *
 * Fetches language model configurations from available providers, filters models with at least one entry,
 * and returns a list of these models with their identifiers and owning providers in the response.
 *
 * Responds with:
 * - 200: A JSON object containing the list of models.
 * - 500: An internal server error message if an exception occurs.
 */
export async function openaiApiModels(
  req: IncomingMessage,
  res: ServerResponse<IncomingMessage>,
  options?: TraceOptions & CancellationOptions,
): Promise<void> {
  const { cancellationToken } = options || {};
  try {
    logVerbose(`models`);
    const providers = await resolveLanguageModelConfigurations(undefined, {
      token: true,
      error: true,
      models: true,
      cancellationToken,
    });
    const resp: ChatModels = {
      object: "list",
      data: providers
        .filter(({ models }) => models?.length)
        .flatMap(({ provider, models }) =>
          models.map(
            ({ id }) =>
              ({
                id: `${provider}:${id}`,
                owned_by: provider,
              }) satisfies Partial<ChatModel>,
          ),
        ),
    };
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(resp));
  } catch (e) {
    logError(errorMessage(e));
    endError(res, 500, `Internal server error`);
  }
}
