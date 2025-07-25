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
import type {
  ChatCompletionResponse,
  ChatCompletionToolCall,
  CreateChatCompletionRequest,
} from "./chattypes.js";
import { errorMessage, isCancelError } from "./error.js";
import { createFetch } from "./fetch.js";
import { logError } from "./util.js";
import { checkCancelled } from "./cancellation.js";

const debug = genaiscriptDebug("openai:responses");

/**
 * Chat completion handler that uses the official OpenAI package
 * to support the Responses API properly.
 */
export const OpenAIResponsesChatCompletion: ChatCompletionHandler = async (
  req,
  cfg,
  options,
  trace,
) => {
  debug(`starting OpenAI Responses API request`);

  const { requestOptions, partialCb, cancellationToken } = options;

  try {
    checkCancelled(cancellationToken);

    // Create fetch instance
    const fetchInstance = await createFetch(options);

    // Create OpenAI client instance
    const openai = new OpenAI({
      apiKey: cfg.token,
      baseURL: cfg.base,
      fetch: fetchInstance,
    });

    debug(`making request to OpenAI Responses API model: ${req.model}`);

    // Convert our request format to OpenAI Responses format
    const openaiRequest: OpenAI.Responses.ResponseCreateParams = {
      model: req.model,
      messages: req.messages,
      temperature: req.temperature,
      max_output_tokens: req.max_completion_tokens,
      top_p: req.top_p,
      stream: req.stream,
      ...requestOptions,
    };

    // Remove undefined values
    Object.keys(openaiRequest).forEach(key => {
      if (openaiRequest[key] === undefined) {
        delete openaiRequest[key];
      }
    });

    checkCancelled(cancellationToken);

    if (req.stream) {
      debug(`streaming request`);
      return await handleStreamingResponse(openai, openaiRequest, options, trace);
    } else {
      debug(`non-streaming request`);
      return await handleNonStreamingResponse(openai, openaiRequest, options, trace);
    }
  } catch (error) {
    if (isCancelError(error)) {
      debug(`request cancelled`);
      return { finishReason: "cancel" };
    }
    
    const errorMsg = errorMessage(error);
    logError(`OpenAI Responses API error: ${errorMsg}`);
    trace?.error(error);
    
    return { 
      finishReason: "fail",
      error: { message: errorMsg, name: "OpenAIError" }
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
  trace: any
): Promise<ChatCompletionResponse> {
  const { cancellationToken } = options;
  
  checkCancelled(cancellationToken);
  
  const response = await openai.responses.create({
    ...request,
    stream: false,
  });

  checkCancelled(cancellationToken);

  trace?.detailsFenced(`📬 response`, response, "json");

  const choice = response.choices?.[0];
  if (!choice) {
    throw new Error("No choices in response");
  }

  const content = choice.message?.content || "";
  const toolCalls = choice.message?.tool_calls?.map(tc => ({
    id: tc.id,
    name: tc.function.name,
    arguments: tc.function.arguments,
  })) || [];

  return {
    text: content,
    toolCalls,
    finishReason: choice.finish_reason as ChatCompletionResponse["finishReason"],
    usage: response.usage ? {
      prompt_tokens: response.usage.prompt_tokens,
      completion_tokens: response.usage.completion_tokens,
      total_tokens: response.usage.total_tokens,
    } : undefined,
    model: response.model,
  };
}

/**
 * Handle streaming OpenAI Responses API response
 */
async function handleStreamingResponse(
  openai: OpenAI,
  request: OpenAI.Responses.ResponseCreateParams,
  options: any,
  trace: any
): Promise<ChatCompletionResponse> {
  const { cancellationToken, partialCb } = options;
  
  checkCancelled(cancellationToken);
  
  const stream = await openai.responses.create({
    ...request,
    stream: true,
  });

  let text = "";
  let finishReason: ChatCompletionResponse["finishReason"];
  let usage: ChatCompletionResponse["usage"];
  let model: string | undefined;
  const toolCalls: ChatCompletionToolCall[] = [];

  try {
    for await (const chunk of stream) {
      checkCancelled(cancellationToken);

      if (chunk.model && !model) {
        model = chunk.model;
      }

      if (chunk.usage) {
        usage = {
          prompt_tokens: chunk.usage.prompt_tokens,
          completion_tokens: chunk.usage.completion_tokens,
          total_tokens: chunk.usage.total_tokens,
        };
      }

      const choice = chunk.choices?.[0];
      if (!choice) continue;

      if (choice.finish_reason) {
        finishReason = choice.finish_reason as ChatCompletionResponse["finishReason"];
      }

      const delta = choice.delta;
      if (delta?.content) {
        text += delta.content;
        
        // Call partial callback if provided
        if (partialCb) {
          partialCb({ text });
        }
        
        // Append to trace
        trace?.appendContent(delta.content);
      }

      // Handle tool calls in streaming
      if (delta?.tool_calls) {
        for (const toolCall of delta.tool_calls) {
          if (toolCall.index !== undefined) {
            // Ensure we have a tool call at this index
            while (toolCalls.length <= toolCall.index) {
              toolCalls.push({
                id: "",
                name: "",
                arguments: "",
              });
            }

            const existingCall = toolCalls[toolCall.index];
            if (toolCall.id) existingCall.id = toolCall.id;
            if (toolCall.function?.name) {
              existingCall.name = toolCall.function.name;
            }
            if (toolCall.function?.arguments) {
              existingCall.arguments = (existingCall.arguments || "") + toolCall.function.arguments;
            }
          }
        }
      }
    }
  } catch (error) {
    if (isCancelError(error)) {
      finishReason = "cancel";
    } else {
      throw error;
    }
  }

  return {
    text,
    toolCalls: toolCalls.filter(tc => tc.id), // Only include completed tool calls
    finishReason: finishReason || "stop",
    usage,
    model,
  };
}
