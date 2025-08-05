"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIv2ResponsesChatCompletion = void 0;
/**
 * OpenAI Responses API implementation using the official OpenAI package
 * This is a separate implementation from the existing OpenAI handler that uses
 * the official OpenAI npm package to support the Responses API properly.
 */
const openai_1 = __importDefault(require("openai"));
const debug_js_1 = require("./debug.js");
const error_js_1 = require("./error.js");
const fetch_js_1 = require("./fetch.js");
const util_js_1 = require("./util.js");
const cancellation_js_1 = require("./cancellation.js");
const cleaners_js_1 = require("./cleaners.js");
const dbg = (0, debug_js_1.genaiscriptDebug)("openai:responses");
function statusToReason(status) {
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
function responseToCompletion(response) {
    if (!response)
        return {};
    return (0, cleaners_js_1.deleteUndefinedValues)({
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
function chatMessageContentToResponseInputItem(content) {
    // TODO
    return undefined;
}
function chatCompletionMessageToResponseInput(messages) {
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
const OpenAIv2ResponsesChatCompletion = async (req, cfg, options, trace) => {
    dbg(`start %s at %s`, req.model, cfg.base);
    const { requestOptions, cancellationToken } = options;
    try {
        // Create fetch instance
        const fetchInstance = await (0, fetch_js_1.createFetch)(options);
        (0, cancellation_js_1.checkCancelled)(cancellationToken);
        // Create OpenAI client instance
        const openai = new openai_1.default({
            apiKey: cfg.token,
            baseURL: cfg.base,
            fetch: fetchInstance,
        });
        // Convert our request format to OpenAI Responses format
        const openaiRequest = (0, cleaners_js_1.deleteUndefinedValues)({
            model: req.model,
            input: chatCompletionMessageToResponseInput(req.messages),
            temperature: req.temperature,
            max_output_tokens: req.max_completion_tokens,
            top_p: req.top_p,
            stream: req.stream,
            ...requestOptions,
        });
        if (openaiRequest.stream) {
            dbg(`streaming request`);
            return await handleStreamingResponse(openai, openaiRequest, options, trace);
        }
        else {
            dbg(`non-streaming request`);
            return await handleNonStreamingResponse(openai, openaiRequest, options, trace);
        }
    }
    catch (error) {
        if ((0, error_js_1.isCancelError)(error)) {
            dbg(`request cancelled`);
            return { finishReason: "cancel" };
        }
        const errorMsg = (0, error_js_1.errorMessage)(error);
        (0, util_js_1.logError)(`OpenAI Responses API error: ${errorMsg}`);
        trace?.error(error);
        return {
            finishReason: "fail",
            error: { message: errorMsg, name: "OpenAIError" },
        };
    }
};
exports.OpenAIv2ResponsesChatCompletion = OpenAIv2ResponsesChatCompletion;
/**
 * Handle non-streaming OpenAI Responses API response
 */
async function handleNonStreamingResponse(openai, request, options, trace) {
    const { cancellationToken } = options;
    const response = await openai.responses.create({
        ...request,
        stream: false,
    });
    (0, cancellation_js_1.checkCancelled)(cancellationToken);
    trace?.detailsFenced(`📬 response`, response, "json");
    const res = responseToCompletion(response);
    return res;
}
/**
 * Handle streaming OpenAI Responses API response
 */
async function handleStreamingResponse(openai, request, options, trace) {
    const { cancellationToken, partialCb } = options;
    (0, cancellation_js_1.checkCancelled)(cancellationToken);
    const res = {};
    try {
        const stream = await openai.responses.create({
            ...request,
            stream: true,
        });
        for await (const chunk of stream) {
            (0, cancellation_js_1.checkCancelled)(cancellationToken);
            dbg(`%s %O`, chunk.type, chunk.response);
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
                    if (partialCb)
                        partialCb({ text: chunk.delta });
                    trace?.appendContent(chunk.delta);
                    break;
                case "response.refusal.done":
                    res.finishReason = "content_filter";
                    break;
            }
        }
    }
    catch (error) {
        if ((0, error_js_1.isCancelError)(error)) {
            res.finishReason = "cancel";
        }
        else {
            throw error;
        }
    }
    return res;
}
//# sourceMappingURL=openai-responses.js.map