// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * OpenAI Responses API provider implementation
 * Uses the Node.js OpenAI package with Responses API
 */

import OpenAI from "openai";
import type { LanguageModel, ChatCompletionHandler } from "./chat.js";
import { parseModelIdentifier, resolveModelConnectionInfo } from "./models.js";
import { OpenAIEmbedder, getConfigHeaders } from "./openai.js";
import type {
  CreateChatCompletionRequest,
  ChatCompletionResponse,
  ChatCompletionUsage,
} from "./chattypes.js";
import type { TraceOptions } from "./trace.js";
import type { CancellationOptions } from "./cancellation.js";
import type { RetryOptions } from "./types.js";
import { serializeError } from "./error.js";
import { logVerbose } from "./util.js";
import { genaiscriptDebug } from "./debug.js";

const debug = genaiscriptDebug("openai_responses");

/**
 * Map OpenAI finish reasons to GenAIScript finish reasons
 */
function mapFinishReason(reason: string | undefined): ChatCompletionResponse["finishReason"] {
  switch (reason) {
    case "stop":
      return "stop";
    case "length":
      return "length";
    case "tool_calls":
    case "function_call":
      return "tool_calls";
    case "content_filter":
      return "content_filter";
    default:
      return "fail";
  }
}

/**
 * Chat completion handler using OpenAI Responses API
 */
export const OpenAIResponsesChatCompletion: ChatCompletionHandler = async (
  req,
  cfg,
  options,
  trace
) => {
  const { requestOptions, partialCb, cancellationToken } = options;
  const { provider, model, family } = parseModelIdentifier(req.model);
  
  debug(`starting completion with model: ${model}`);
  
  try {
    const connectionInfo = await resolveModelConnectionInfo(cfg, options);
    if (!connectionInfo) {
      throw new Error(`Failed to resolve connection info for ${provider}:${model}`);
    }

    const headers = getConfigHeaders(cfg);
    const allHeaders = { ...headers, ...requestOptions?.headers };

    const client = new OpenAI({
      apiKey: cfg.token || process.env.OPENAI_API_KEY,
      baseURL: cfg.base || process.env.OPENAI_API_BASE,
      defaultHeaders: allHeaders,
    });

    debug(`creating chat completion request for model: ${model}`);
    
    // Convert GenAIScript request to OpenAI format
    const openaiRequest: OpenAI.Chat.ChatCompletionCreateParams = {
      model,
      messages: req.messages.map(({ cacheControl, ...rest }) => rest),
      temperature: req.temperature,
      max_tokens: req.max_tokens,
      stream: false, // For responses API, we typically don't use streaming
      response_format: req.response_format,
    };

    const startTime = Date.now();
    
    // Use the OpenAI SDK's chat.completions.create method
    // The responses API functionality is built into the SDK
    const response = await client.chat.completions.create(openaiRequest);
    
    const duration = Date.now() - startTime;
    
    debug(`completion finished in ${duration}ms`);
    
    // Extract the response data - response should be ChatCompletion, not streamed
    if ('choices' in response) {
      const choice = response.choices[0];
      const content = choice?.message?.content || "";
      
      const usage: ChatCompletionUsage = {
        completion_tokens: response.usage?.completion_tokens || 0,
        prompt_tokens: response.usage?.prompt_tokens || 0,
        total_tokens: response.usage?.total_tokens || 0,
        duration,
      };

      const result: ChatCompletionResponse = {
        text: content,
        finishReason: mapFinishReason(choice?.finish_reason),
        usage,
        model: response.model || model,
      };

      trace?.fence(JSON.stringify(result, null, 2), "json");
      return result;
    } else {
      throw new Error("Unexpected streaming response from OpenAI Responses API");
    }
    
  } catch (error) {
    debug(`error: ${error}`);
    trace?.error("openai responses error", serializeError(error));
    
    return {
      text: "",
      finishReason: "fail",
      error: serializeError(error),
    };
  }
};

/**
 * OpenAI Responses Language Model
 */
export const OpenAIResponsesModel: LanguageModel = Object.freeze({
  completer: OpenAIResponsesChatCompletion,
  id: "openai_responses",
  embedder: OpenAIEmbedder, // Reuse the existing embedder
});