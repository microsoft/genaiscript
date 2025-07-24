// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * OpenAI Responses API implementation using the official OpenAI package
 * This is a separate implementation from the existing OpenAI handler that uses
 * the official OpenAI npm package to support the Responses API properly.
 */

import OpenAI from "openai";
import { genaiscriptDebug } from "./debug.js";
import type {
  ChatCompletionHandler,
  LanguageModel,
} from "./chat.js";
import type {
  ChatCompletion,
  ChatCompletionResponse,
  CreateChatCompletionRequest,
} from "./chattypes.js";
import { errorMessage, isCancelError, RequestError } from "./error.js";
import { createFetch } from "./fetch.js";
import { logError, logVerbose } from "./util.js";
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
  trace
) => {
  debug(`starting OpenAI Responses API request`);
  
  const { requestOptions, partialCb, cache } = options;
  const { cancellationToken } = options;

  try {
    // Create fetch instance
    const fetchInstance = await createFetch({
      userAgent: "genaiscript",
      ...requestOptions,
    });

    // Create OpenAI client instance
    const openai = new OpenAI({
      apiKey: cfg.token,
      baseURL: cfg.base,
      fetch: fetchInstance,
    });

    debug(`making request to OpenAI Responses API`);
    
    // Convert our request format to OpenAI format
    const openaiRequest: OpenAI.Chat.Completions.ChatCompletionCreateParams = {
      model: req.model,
      messages: req.messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      temperature: req.temperature,
      max_tokens: req.max_tokens,
      top_p: req.top_p,
      frequency_penalty: req.frequency_penalty,
      presence_penalty: req.presence_penalty,
      seed: req.seed,
      stop: req.stop,
      stream: req.stream,
      tools: req.tools as OpenAI.Chat.Completions.ChatCompletionTool[],
      tool_choice: req.tool_choice,
      response_format: req.response_format,
      logprobs: req.logprobs,
      top_logprobs: req.top_logprobs,
    };

    let response: OpenAI.Chat.Completions.ChatCompletion;
    
    if (req.stream) {
      debug(`streaming request`);
      const stream = await openai.chat.completions.create({
        ...openaiRequest,
        stream: true,
      });

      let fullResponse: Partial<ChatCompletion> = {
        id: "",
        object: "chat.completion",
        created: Date.now(),
        model: req.model,
        choices: [{
          index: 0,
          message: { role: "assistant", content: "" },
          finish_reason: null,
        }],
      };

      for await (const chunk of stream) {
        checkCancelled(cancellationToken);

        // Update response with chunk data
        if (chunk.choices?.[0]?.delta?.content) {
          fullResponse.choices[0].message.content += chunk.choices[0].delta.content;
        }
        
        if (chunk.choices?.[0]?.finish_reason) {
          fullResponse.choices[0].finish_reason = chunk.choices[0].finish_reason;
        }

        if (chunk.id) {
          fullResponse.id = chunk.id;
        }

        // Call partial callback if provided
        if (partialCb && chunk.choices?.[0]?.delta?.content) {
          partialCb({
            type: "chunk",
            chunk: {
              choices: [{
                index: 0,
                delta: chunk.choices[0].delta,
                finish_reason: chunk.choices[0].finish_reason,
              }],
            },
          });
        }
      }

      response = fullResponse as OpenAI.Chat.Completions.ChatCompletion;
    } else {
      debug(`non-streaming request`);
      response = await openai.chat.completions.create(openaiRequest);
    }

    debug(`received response from OpenAI Responses API`);

    // Convert OpenAI response format to our ChatCompletionResponse format
    const result: ChatCompletionResponse = {
      text: response.choices[0]?.message?.content || "",
      finishReason: response.choices[0]?.finish_reason || "stop",
      usage: response.usage ? {
        completion_tokens: response.usage.completion_tokens,
        prompt_tokens: response.usage.prompt_tokens,
        total_tokens: response.usage.total_tokens,
      } : undefined,
      model: response.model,
      chatCompletion: response as ChatCompletion,
    };

    return result;

  } catch (error) {
    debug(`error in OpenAI Responses API request: ${error}`);
    
    if (isCancelError(error)) {
      throw error;
    }

    logError(`OpenAI Responses API error: ${errorMessage(error)}`);
    throw new RequestError(
      `OpenAI Responses API request failed: ${errorMessage(error)}`,
      "openai_responses_error",
      error
    );
  }
};

/**
 * Create a language model for OpenAI Responses API
 */
export function OpenAIResponsesModel(): LanguageModel {
  return Object.freeze<LanguageModel>({
    id: "openai_responses",
    completer: OpenAIResponsesChatCompletion,
  });
}