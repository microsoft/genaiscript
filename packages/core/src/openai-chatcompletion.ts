// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import {
  AZURE_AI_INFERENCE_VERSION,
  AZURE_OPENAI_API_VERSION,
  MODEL_PROVIDER_ALIBABA,
  MODEL_PROVIDER_AZURE_AI_INFERENCE,
  MODEL_PROVIDER_AZURE_OPENAI,
  MODEL_PROVIDER_AZURE_SERVERLESS_MODELS,
  MODEL_PROVIDER_AZURE_SERVERLESS_OPENAI,
  MODEL_PROVIDER_GITHUB,
  MODEL_PROVIDER_HUGGINGFACE,
  MODEL_PROVIDER_OPENAI,
  MODEL_PROVIDER_OPENAI_HOSTS,
  OPENROUTER_API_CHAT_URL,
  OPENROUTER_SITE_NAME_HEADER,
  OPENROUTER_SITE_URL_HEADER,
  THINK_END_TOKEN_REGEX,
  THINK_START_TOKEN_REGEX,
  TOOL_ID,
  TOOL_NAME,
  TOOL_URL,
} from "./constants.js";
import { approximateTokens } from "./tokens.js";
import type { ChatCompletionHandler } from "./chat.js";
import { RequestError, errorMessage, serializeError } from "./error.js";
import { createFetch } from "./fetch.js";
import { parseModelIdentifier } from "./models.js";
import { JSON5TryParse } from "./json5.js";
import type {
  ChatCompletionToolCall,
  ChatCompletionResponse,
  ChatCompletionChunk,
  ChatCompletionUsage,
  ChatCompletion,
  ChatCompletionChunkChoice,
  ChatCompletionChoice,
  CreateChatCompletionRequest,
  ChatCompletionTokenLogprob,
} from "./chattypes.js";
import { resolveTokenEncoder } from "./encoders.js";
import { INITryParse } from "./ini.js";
import { serializeChunkChoiceToLogProbs } from "./logprob.js";
import type { LanguageModelConfiguration } from "./server/messages.js";
import {
  deleteUndefinedValues,
  isEmptyString,
  normalizeInt,
  trimTrailingSlash,
} from "./cleaners.js";
import { traceFetchPost } from "./fetchtext.js";
import { providerFeatures } from "./features.js";
import { genaiscriptDebug } from "./debug.js";
import type { Logprob, SerializedError } from "./types.js";
import { createUTF8Decoder } from "./utf8.js";

const dbg = genaiscriptDebug("openai");
const dbgMessages = dbg.extend("msg");
dbgMessages.enabled = false;

/**
 * Generates configuration headers for API requests based on the provided configuration object.
 *
 * @param cfg - The configuration object containing details for API access.
 *   - token: Authentication token for the API.
 *   - type: The type of model (e.g., azure_serverless_models, openai, etc.).
 *   - base: Base URL of the API.
 *   - provider: Identifier for the model provider.
 * @returns A record of key-value pairs representing the headers, including:
 *   - Authorization: The formatted authorization header if applicable.
 *   - api-key: API key if Bearer authentication is not used.
 *   - User-Agent: A constant user agent identifier for the tool.
 */
export function getConfigHeaders(cfg: LanguageModelConfiguration) {
  let { token, type, base, provider } = cfg;
  if (type === "azure_serverless_models") {
    const keys = INITryParse(token);
    if (keys && Object.keys(keys).length > 1) token = keys[cfg.model];
  }
  const features = providerFeatures(provider);
  const useBearer = features?.bearerToken !== false;
  const isBearer = /^Bearer /i.test(cfg.token);
  const Authorization = isBearer
    ? token
    : token && (useBearer || base === OPENROUTER_API_CHAT_URL)
      ? `Bearer ${token}`
      : undefined;
  const apiKey = Authorization ? undefined : token;
  const res: Record<string, string> = deleteUndefinedValues({
    Authorization,
    "api-key": apiKey,
    "User-Agent": TOOL_ID,
  });
  return res;
}

export const OpenAIv1ChatCompletion: ChatCompletionHandler = async (req, cfg, options, trace) => {
  const {
    requestOptions,
    partialCb,
    retries,
    retryDelay,
    maxDelay,
    maxRetryAfter,
    cancellationToken,
    inner,
  } = options;
  const { headers = {}, ...rest } = requestOptions || {};
  const { provider, model, family, reasoningEffort } = parseModelIdentifier(req.model);
  const features = providerFeatures(provider);
  const { encode: encoder } = await resolveTokenEncoder(family);

  const postReq = structuredClone({
    ...req,
    stream: true,
    stream_options: { include_usage: true },
    model,
    messages: req.messages.map(({ cacheControl, ...rest }) => ({
      ...rest,
    })),
  } satisfies CreateChatCompletionRequest);

  // stream_options fails in some cases
  if (family === "gpt-4-turbo-v" || /mistral/i.test(family)) {
    dbg(`removing stream_options`);
    delete postReq.stream_options;
  }

  if (MODEL_PROVIDER_OPENAI_HOSTS.includes(provider)) {
    if (/^(openai\/)?o\d|gpt-4\.1/.test(family)) {
      dbg(`changing max_tokens to max_completion_tokens`);
      if (postReq.max_tokens) {
        postReq.max_completion_tokens = postReq.max_tokens;
        delete postReq.max_tokens;
      }
    }

    if (/^(openai\/)?o\d/.test(family)) {
      dbg(`removing options to support o1/o3/o4`);
      delete postReq.temperature;
      delete postReq.top_p;
      delete postReq.presence_penalty;
      delete postReq.frequency_penalty;
      delete postReq.logprobs;
      delete postReq.top_logprobs;
      delete postReq.logit_bias;
      if (!postReq.reasoning_effort && reasoningEffort) {
        postReq.model = family;
        postReq.reasoning_effort = reasoningEffort;
      }
    }

    if (/^(openai\/)?o1/.test(family)) {
      dbg(`removing options to support o1`);
      const preview = /^o1-(preview|mini)/i.test(family);
      delete postReq.stream;
      delete postReq.stream_options;
      for (const msg of postReq.messages) {
        if (msg.role === "system") {
          (msg as any).role = preview ? "user" : "developer";
        }
      }
    } else if (/^(openai\/)?o3/i.test(family)) {
      for (const msg of postReq.messages) {
        if (msg.role === "system") {
          (msg as any).role = "developer";
        }
      }
    }
  }

  const singleModel = !!features?.singleModel;
  if (singleModel) delete postReq.model;

  let url = "";
  const toolCalls: ChatCompletionToolCall[] = [];

  if (
    cfg.type === MODEL_PROVIDER_OPENAI ||
    cfg.type === "localai" ||
    cfg.type === MODEL_PROVIDER_ALIBABA ||
    cfg.type === MODEL_PROVIDER_HUGGINGFACE
  ) {
    url = trimTrailingSlash(cfg.base) + "/chat/completions";
    if (url === OPENROUTER_API_CHAT_URL) {
      (headers as any)[OPENROUTER_SITE_URL_HEADER] = process.env.OPENROUTER_SITE_URL || TOOL_URL;
      (headers as any)[OPENROUTER_SITE_NAME_HEADER] = process.env.OPENROUTER_SITE_NAME || TOOL_NAME;
    }
  } else if (cfg.type === MODEL_PROVIDER_AZURE_OPENAI) {
    delete postReq.model;
    const version = cfg.version || AZURE_OPENAI_API_VERSION;
    trace?.itemValue(`version`, version);
    url = trimTrailingSlash(cfg.base) + "/" + family + `/chat/completions?api-version=${version}`;
  } else if (cfg.type === MODEL_PROVIDER_AZURE_AI_INFERENCE) {
    const version = cfg.version;
    trace?.itemValue(`version`, version);
    url = trimTrailingSlash(cfg.base) + `/chat/completions`;
    if (version) url += `?api-version=${version}`;
    (headers as any)["extra-parameters"] = "pass-through";
  } else if (cfg.type === MODEL_PROVIDER_AZURE_SERVERLESS_MODELS) {
    const version = cfg.version || AZURE_AI_INFERENCE_VERSION;
    trace?.itemValue(`version`, version);
    url =
      trimTrailingSlash(cfg.base).replace(
        /^https?:\/\/(?<deployment>[^\.]+)\.(?<region>[^\.]+)\.models\.ai\.azure\.com/i,
        (m, deployment, region) => `https://${postReq.model}.${region}.models.ai.azure.com`,
      ) + `/chat/completions?api-version=${version}`;
    (headers as any)["extra-parameters"] = "pass-through";
    delete postReq.model;
    delete postReq.stream_options;
  } else if (cfg.type === MODEL_PROVIDER_AZURE_SERVERLESS_OPENAI) {
    const version = cfg.version || AZURE_AI_INFERENCE_VERSION;
    trace?.itemValue(`version`, version);
    url = trimTrailingSlash(cfg.base) + "/" + family + `/chat/completions?api-version=${version}`;
    // https://learn.microsoft.com/en-us/azure/machine-learning/reference-model-inference-api?view=azureml-api-2&tabs=javascript#extensibility
    (headers as any)["extra-parameters"] = "pass-through";
    delete postReq.model;
  } else if (cfg.type === MODEL_PROVIDER_GITHUB) {
    url = trimTrailingSlash(cfg.base) + "/chat/completions";
    const { prefix } = /^(?<prefix>[^-]+)-([^\/]+)$/.exec(postReq.model)?.groups || {};
    const patch = {
      gpt: "openai",
      o: "openai",
      "text-embedding": "openai",
      phi: "microsoft",
      meta: "meta",
      llama: "meta",
      mistral: "mistral-ai",
      deepseek: "deepseek",
    }[prefix?.toLowerCase() || ""];
    if (patch) {
      postReq.model = `${patch}/${postReq.model}`;
      dbg(`updated model to ${postReq.model}`);
    }
  } else throw new Error(`api type ${cfg.type} not supported`);

  trace?.itemValue(`url`, `[${url}](${url})`);
  dbg(`url: ${url}`);

  let numTokens = 0;
  let numReasoningTokens = 0;
  const fetchRetry = await createFetch({
    trace,
    retries,
    retryDelay,
    maxDelay,
    maxRetryAfter,
    cancellationToken,
  });
  trace?.dispatchChange();

  const fetchHeaders: HeadersInit = {
    "Content-Type": "application/json",
    ...getConfigHeaders(cfg),
    ...(headers || {}),
  };
  traceFetchPost(trace, url, fetchHeaders as any, postReq);
  const body = JSON.stringify(postReq);
  let r: Response;
  try {
    r = await fetchRetry(url, {
      headers: fetchHeaders,
      body,
      method: "POST",
      ...(rest || {}),
    });
  } catch (e) {
    trace?.error(errorMessage(e), e);
    throw e;
  }

  trace?.itemValue(`status`, `${r.status} ${r.statusText}`);
  dbg(`response: ${r.status} ${r.statusText}`);
  if (r.status !== 200) {
    let responseBody: string;
    try {
      responseBody = await r.text();
    } catch (e) {}
    if (!responseBody) responseBody;
    trace?.fence(responseBody, "json");
    const errors = JSON5TryParse(responseBody, {}) as
      | {
          error: any;
          message: string;
        }
      | { error: { message: string } }[]
      | { error: { message: string } };
    const error = Array.isArray(errors) ? errors[0]?.error : errors;
    throw new RequestError(
      r.status,
      errorMessage(error) || r.statusText,
      errors,
      responseBody,
      normalizeInt(r.headers.get("retry-after")),
    );
  }

  let done = false;
  let finishReason: ChatCompletionResponse["finishReason"] = undefined;
  let chatResp = "";
  let reasoningChatResp = "";
  let pref = "";
  let usage: ChatCompletionUsage;
  let error: SerializedError;
  let responseModel: string;
  const lbs: ChatCompletionTokenLogprob[] = [];

  let reasoning = false;

  const doChoices = (json: string, tokens: Logprob[], reasoningTokens: Logprob[]) => {
    const obj: ChatCompletionChunk | ChatCompletion = JSON.parse(json);

    if (!postReq.stream) trace?.detailsFenced(`📬 response`, obj, "json");
    dbgMessages(`%O`, obj);

    if (obj.usage) usage = obj.usage;
    if (!responseModel && obj.model) {
      responseModel = obj.model;
      dbg(`model: ${responseModel}`);
    }
    if (!obj.choices?.length) return;
    else if (obj.choices?.length != 1) throw new Error("too many choices in response");
    const choice = obj.choices[0];
    const { finish_reason } = choice;
    if (finish_reason) {
      dbg(`finish reason: ${finish_reason}`);
      finishReason = finish_reason as any;
    }
    if ((choice as ChatCompletionChunkChoice).delta) {
      const { delta, logprobs } = choice as ChatCompletionChunkChoice;
      if (logprobs?.content) lbs.push(...logprobs.content);
      if (typeof delta?.content === "string" && delta.content !== "") {
        let content = delta.content;
        if (!reasoning && THINK_START_TOKEN_REGEX.test(content)) {
          dbg(`entering <think>`);
          reasoning = true;
          content = content.replace(THINK_START_TOKEN_REGEX, "");
        } else if (reasoning && THINK_END_TOKEN_REGEX.test(content)) {
          dbg(`leaving <think>`);
          reasoning = false;
          content = content.replace(THINK_END_TOKEN_REGEX, "");
        }

        if (!isEmptyString(content)) {
          if (reasoning) {
            numReasoningTokens += approximateTokens(content, {
              encoder,
            });
            reasoningChatResp += content;
            reasoningTokens.push(
              ...serializeChunkChoiceToLogProbs(choice as ChatCompletionChunkChoice),
            );
          } else {
            numTokens += approximateTokens(content, { encoder });
            chatResp += content;
            tokens.push(...serializeChunkChoiceToLogProbs(choice as ChatCompletionChunkChoice));
          }
          trace?.appendToken(content);
        }
      }
      if (typeof delta?.reasoning_content === "string" && delta.reasoning_content !== "") {
        numTokens += approximateTokens(delta.reasoning_content, {
          encoder,
        });
        reasoningChatResp += delta.reasoning_content;
        reasoningTokens.push(
          ...serializeChunkChoiceToLogProbs(choice as ChatCompletionChunkChoice),
        );
        trace?.appendToken(delta.reasoning_content);
      }
      if (Array.isArray(delta?.tool_calls)) {
        const { tool_calls } = delta;
        for (const call of tool_calls) {
          const index = call.index ?? toolCalls.length;
          const tc =
            toolCalls[index] ||
            (toolCalls[index] = {
              id: call.id,
              name: call.function.name,
              arguments: "",
            });
          if (call.function.arguments) tc.arguments += call.function.arguments;
        }
      }
    } else if ((choice as ChatCompletionChoice).message) {
      const { message } = choice as ChatCompletionChoice;
      chatResp = message.content;
      reasoningChatResp = message.reasoning_content;
      numTokens = usage?.total_tokens ?? approximateTokens(chatResp, { encoder });
      if (Array.isArray(message?.tool_calls)) {
        const { tool_calls } = message;
        for (let calli = 0; calli < tool_calls.length; calli++) {
          const call = tool_calls[calli];
          const tc =
            toolCalls[calli] ||
            (toolCalls[calli] = {
              id: call.id,
              name: call.function.name,
              arguments: "",
            });
          if (call.function.arguments) tc.arguments += call.function.arguments;
        }
      }
      partialCb?.(
        deleteUndefinedValues({
          responseSoFar: chatResp,
          reasoningSoFar: reasoningChatResp,
          tokensSoFar: numTokens,
          responseChunk: chatResp,
          reasoningChunk: reasoningChatResp,
          inner,
        }),
      );
    }

    if (finish_reason === "function_call" || toolCalls.length > 0) {
      finishReason = "tool_calls";
    } else {
      finishReason = finish_reason;
    }
  };

  trace?.appendContent("\n\n");
  if (!postReq.stream) {
    const responseBody = await r.text();
    doChoices(responseBody, [], []);
  } else {
    const decoder = createUTF8Decoder();
    const doChunk = (value: Uint8Array) => {
      // Massage and parse the chunk of data
      const tokens: Logprob[] = [];
      const reasoningTokens: Logprob[] = [];
      let chunk = decoder.decode(value, { stream: true });

      chunk = pref + chunk;
      const ch0 = chatResp;
      const rch0 = reasoningChatResp;
      chunk = chunk.replace(/^data:\s*(.*)[\r\n]+/gm, (_, json) => {
        if (json === "[DONE]") {
          done = true;
          return "";
        }
        try {
          doChoices(json, tokens, reasoningTokens);
        } catch (e) {
          trace?.error(`error processing chunk`, e);
        }
        return "";
      });
      // end replace
      const reasoningProgress = reasoningChatResp.slice(rch0.length);
      const chatProgress = chatResp.slice(ch0.length);
      if (!isEmptyString(chatProgress) || !isEmptyString(reasoningProgress)) {
        // logVerbose(`... ${progress.length} chars`);
        partialCb?.(
          deleteUndefinedValues({
            responseSoFar: chatResp,
            reasoningSoFar: reasoningChatResp,
            reasoningChunk: reasoningProgress,
            tokensSoFar: numTokens,
            responseChunk: chatProgress,
            responseTokens: tokens,
            reasoningTokens,
            inner,
          }),
        );
      }
      pref = chunk;
    };

    try {
      if (r.body.getReader) {
        const reader = r.body.getReader();
        while (!cancellationToken?.isCancellationRequested && !done) {
          const { done: readerDone, value } = await reader.read();
          if (readerDone) break;
          doChunk(value);
        }
      } else {
        for await (const value of r.body as any) {
          if (cancellationToken?.isCancellationRequested || done) break;
          doChunk(value);
        }
      }
      if (cancellationToken?.isCancellationRequested) finishReason = "cancel";
      else if (toolCalls?.length) finishReason = "tool_calls";
      finishReason = finishReason || "stop"; // some provider do not implement this final mesage
    } catch (e) {
      finishReason = "fail";
      error = serializeError(e);
    }
  }

  trace?.appendContent("\n\n");
  if (responseModel) trace?.itemValue(`model`, responseModel);
  trace?.itemValue(`🏁 finish reason`, finishReason);
  if (usage?.total_tokens) {
    trace?.itemValue(
      `🪙 tokens`,
      `${usage.total_tokens} total, ${usage.prompt_tokens} prompt, ${usage.completion_tokens} completion`,
    );
  }

  return deleteUndefinedValues({
    text: chatResp,
    reasoning: reasoningChatResp,
    toolCalls,
    finishReason,
    usage,
    error,
    model: responseModel,
    logprobs: lbs,
  }) satisfies ChatCompletionResponse;
};
