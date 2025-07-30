// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * OpenAI Responses API implementation using the official OpenAI package
 * This is a separate implementation from the existing OpenAI handler that uses
 * the official OpenAI npm package to support the Responses API properly.
 */

import OpenAI from "openai";
import { genaiscriptDebug } from "./debug.js";
import type { ChatCompletionHandler } from "./chat.js";
import type { ChatCompletionMessageParam, ChatCompletionResponse } from "./chattypes.js";
import { errorMessage, isCancelError } from "./error.js";
import { createFetch } from "./fetch.js";
import { logError } from "./util.js";
import { checkCancelled } from "./cancellation.js";
import { deleteUndefinedValues } from "./cleaners.js";
const dbg = genaiscriptDebug("openai:responses");

function statusToReason(
  status: OpenAI.Responses.ResponseStatus,
): ChatCompletionResponse["finishReason"] {
  switch (status) {
    case "completed":
      return "stop";
    case "failed":
      return "fail";
    case "cancelled":
      return "cancel";
    case "incomplete":
      return "length";
    default:
      return undefined;
  }
}

function responseToCompletion(response: OpenAI.Responses.Response): ChatCompletionResponse {
  if (!response) return {};
  return deleteUndefinedValues({
    text: response.output_text,
    toolCalls: response.output
      .filter((o) => o.type === "function_call")
      .map((o) => ({
        id: o.call_id,
        name: o.name,
        arguments: o.arguments,
      })),
    usage: response.usage
      ? {
          prompt_tokens: response.usage.input_tokens,
          completion_tokens: response.usage.output_tokens,
          total_tokens: response.usage.total_tokens,
        }
      : undefined,
    model: response.model,
    error: response.error,
    finishReason: statusToReason(response.status),
  });
}

function chatMessageContentToResponseInputItem(
  content: ChatCompletionMessageParam["content"],
): (OpenAI.Responses.ResponseOutputText | OpenAI.Responses.ResponseOutputRefusal)[] {
  // TODO
  return undefined;
}

function chatCompletionMessageToResponseInput(
  messages: ChatCompletionMessageParam[],
): OpenAI.Responses.ResponseInput {
  // TODO
  return undefined;
  /*
  return messages.map((msg) => {
    switch (msg.role) {
      case "assistant":
        // TODO
        return {
          type: "message",
          status: "completed",
          role: "assistant",
          content: chatMessageContentToResponseInputItem(msg.content),
        } satisfies OpenAI.Responses.ResponseOutputMessage;
      case "system":
        return {
          role: "developer",
          content: chatMessageContentToResponseInputItem(msg.content),
        } satisfies OpenAI.Responses.ResponseInputItem.Message;
      case "user":
        return {
          role: "user",
          content: chatMessageContentToResponseInputItem(msg.content),
        } satisfies OpenAI.Responses.ResponseInputItem.Message;
      case "function":
      case "tool":
        return {
          type: "function_call_output",
        } satisfies OpenAI.Responses.ResponseFunctionToolCallOutputItem;
    }
  });
  */
}

/**
 * Chat completion handler that uses the official OpenAI package
 * to support the Responses API properly.
 */
export const OpenAIv2ResponsesChatCompletion: ChatCompletionHandler = async (
  req,
  cfg,
  options,
  trace,
) => {
  dbg(`start %s at %s`, req.model, cfg.base);

  const { requestOptions, cancellationToken } = options;

  try {
    // Create fetch instance
    const fetchInstance = await createFetch(options);
    checkCancelled(cancellationToken);

    // Create OpenAI client instance
    const openai = new OpenAI({
      apiKey: cfg.token,
      baseURL: cfg.base,
      fetch: fetchInstance,
    });

    // Convert our request format to OpenAI Responses format
    const openaiRequest: OpenAI.Responses.ResponseCreateParams = deleteUndefinedValues({
      model: req.model,
      input: chatCompletionMessageToResponseInput(req.messages),
      temperature: req.temperature,
      max_output_tokens: req.max_completion_tokens,
      top_p: req.top_p,
      stream: req.stream,
      ...requestOptions,
    } satisfies OpenAI.Responses.ResponseCreateParams);

    if (openaiRequest.stream) {
      dbg(`streaming request`);
      return await handleStreamingResponse(openai, openaiRequest, options, trace);
    } else {
      dbg(`non-streaming request`);
      return await handleNonStreamingResponse(openai, openaiRequest, options, trace);
    }
  } catch (error) {
    if (isCancelError(error)) {
      dbg(`request cancelled`);
      return { finishReason: "cancel" };
    }

    const errorMsg = errorMessage(error);
    logError(`OpenAI Responses API error: ${errorMsg}`);
    trace?.error(error);

    return {
      finishReason: "fail",
      error: { message: errorMsg, name: "OpenAIError" },
    };
  }
};

/**
 * Handle non-streaming OpenAI Responses API response
 */
async function handleNonStreamingResponse(
  openai: OpenAI,
  request: OpenAI.Responses.ResponseCreateParams,
  options: any,
  trace: any,
): Promise<ChatCompletionResponse> {
  const { cancellationToken } = options;

  const response = await openai.responses.create({
    ...request,
    stream: false,
  });
  checkCancelled(cancellationToken);
  trace?.detailsFenced(`📬 response`, response, "json");
  const res = responseToCompletion(response);
  return res;
}

/**
 * Handle streaming OpenAI Responses API response
 */
async function handleStreamingResponse(
  openai: OpenAI,
  request: OpenAI.Responses.ResponseCreateParams,
  options: any,
  trace: any,
): Promise<ChatCompletionResponse> {
  const { cancellationToken, partialCb } = options;

  checkCancelled(cancellationToken);

  const res: ChatCompletionResponse = {};
  try {
    const stream = await openai.responses.create({
      ...request,
      stream: true,
    });
    for await (const chunk of stream) {
      checkCancelled(cancellationToken);

      dbg(`%s %O`, chunk.type, (chunk as any).response);
      switch (chunk.type) {
        case "error":
          res.error = { code: chunk.code, message: chunk.message };
          break;
        case "response.completed":
          Object.assign(res, responseToCompletion(chunk.response));
          res.finishReason = "stop";
          break;
        case "response.failed":
          Object.assign(res, responseToCompletion(chunk.response));
          res.finishReason = "fail";
          break;
        case "response.created":
          Object.assign(res, responseToCompletion(chunk.response));
          break;
        case "response.output_text.delta":
          if (partialCb) partialCb({ text: chunk.delta });
          trace?.appendContent(chunk.delta);
          break;
        case "response.refusal.done":
          res.finishReason = "content_filter";
          break;
      }
    }
  } catch (error) {
    if (isCancelError(error)) {
      res.finishReason = "cancel";
    } else {
      throw error;
    }
  }

  return res;
}
