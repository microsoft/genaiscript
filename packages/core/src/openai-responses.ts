// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * OpenAI Responses API implementation using the official OpenAI package
 * This is a separate implementation from the existing OpenAI handler that uses
 * the official OpenAI npm package to support the Responses API properly.
 */

import OpenAI from "openai";
import { genaiscriptDebug } from "./debug.js";
import type { ChatCompletionHandler, LanguageModel } from "./chat.js";
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
  trace,
) => {
  debug(`starting OpenAI Responses API request`);

  const { requestOptions, partialCb, cache } = options;
  const { cancellationToken } = options;

  try {
    // Create fetch instance
    const fetchInstance = await createFetch(options);

    // Create OpenAI client instance
    const openai = new OpenAI({
      apiKey: cfg.token,
      baseURL: cfg.base,
      fetch: fetchInstance,
    });

    debug(`making request to OpenAI Responses API`);

    // Convert our request format to OpenAI format
    const openaiRequest: OpenAI.Responses.ResponseCreateParams = {
      model: req.model,
      temperature: req.temperature,
      max_output_tokens: req.max_completion_tokens,
      top_p: req.top_p,
      stream: req.stream,
    };

    if (req.stream) {
      debug(`streaming request`);
      const stream = await openai.responses.create({
        ...openaiRequest,
        stream: true,
      });
    } else {
      const response = await openai.responses.create({
        ...openaiRequest,
        stream: false,
      });
    }

    throw new Error("not implemented");
  } catch (error) {
    logError(`OpenAI Responses API error: ${errorMessage(error)}`);
    throw error;
  }
};
