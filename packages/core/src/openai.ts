// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { ellipse, logError, logInfo, logVerbose } from "./util.js";
import {
  AZURE_OPENAI_API_VERSION,
  MODEL_PROVIDER_AZURE_OPENAI,
  MODEL_PROVIDER_AZURE_SERVERLESS_MODELS,
  MODEL_PROVIDER_AZURE_SERVERLESS_OPENAI,
} from "./constants.js";
import type {
  ChatCompletionHandler,
  CreateImageRequest,
  CreateImageResult,
  CreateSpeechRequest,
  CreateSpeechResult,
  CreateTranscriptionRequest,
  LanguageModel,
  ListModelsFunction,
} from "./chat.js";
import { errorMessage, isCancelError, serializeError } from "./error.js";
import { createFetch } from "./fetch.js";
import type {
  EmbeddingCreateResponse,
  EmbeddingCreateParams,
  EmbeddingResult,
  ImageGenerationResponse,
} from "./chattypes.js";
import type { CancellationOptions } from "./cancellation.js";
import { checkCancelled } from "./cancellation.js";
import type { TraceOptions } from "./trace.js";
import type { LanguageModelConfiguration } from "./server/messages.js";
import prettyBytes from "pretty-bytes";
import { deleteUndefinedValues, trimTrailingSlash } from "./cleaners.js";
import { fromBase64 } from "./base64.js";
import { traceFetchPost } from "./fetchtext.js";
import { genaiscriptDebug } from "./debug.js";
import { OpenAIv2ResponsesChatCompletion } from "./openai-responses.js";
import type { LanguageModelInfo, RetryOptions, TranscriptionResult } from "./types.js";
import { resolveBufferLike } from "./bufferlike.js";
import { getConfigHeaders, OpenAIv1ChatCompletion } from "./openai-chatcompletion.js";

const dbg = genaiscriptDebug("openai");
const dbgMessages = dbg.extend("msg");
dbgMessages.enabled = false;

export const OpenAIChatCompletion: ChatCompletionHandler = async (req, cfg, options, trace) => {
  //const { provider } = parseModelIdentifier(req.model);
  // const features = providerFeatures(provider);
  const useResponsesApi = !!process.env.OPENAI_RESPONSES; // features?.responsesApi;
  if (useResponsesApi) return OpenAIv2ResponsesChatCompletion(req, cfg, options, trace);
  else return OpenAIv1ChatCompletion(req, cfg, options, trace);
};

export const OpenAIListModels: ListModelsFunction = async (cfg, options) => {
  try {
    const fetch = await createFetch({ retries: 0, ...(options || {}) });
    let url = trimTrailingSlash(cfg.base) + "/models";
    if (cfg.provider === MODEL_PROVIDER_AZURE_OPENAI) {
      url = trimTrailingSlash(cfg.base).replace(/deployments$/, "") + "/models";
    }
    const res = await fetch(url, {
      method: "GET",
      headers: {
        ...getConfigHeaders(cfg),
        Accept: "application/json",
      },
    });
    if (res.status !== 200)
      return {
        ok: false,
        status: res.status,
        error: serializeError(await res.json()),
      };
    const { data } = (await res.json()) as {
      object: "list";
      data: {
        id: string;
        object: "model";
        created: number;
        owned_by: string;
      }[];
    };
    return {
      ok: true,
      models: data.map(
        (m) =>
          ({
            id: m.id,
            details: `${m.id}, ${m.owned_by}`,
          }) satisfies LanguageModelInfo,
      ),
    };
  } catch (e) {
    return { ok: false, error: serializeError(e) };
  }
};

/**
 * Transcribes an audio file using the specified language model configuration.
 * Can also perform translation if requested.
 *
 * @param req - Contains the transcription or translation details including:
 *              - `file`: The audio file to be transcribed.
 *              - `model`: The model to be used for transcription or translation.
 *              - `translate`: Optional, specifies if the operation is a translation.
 *              - `temperature`: Optional, adjusts the creativity of the transcription (if supported).
 *              - `language`: Optional, specifies the language of the audio.
 * @param cfg - Language model configuration, includes:
 *              - `base`: The base API URL for the model.
 *              - `provider`: The identifier of the model provider.
 *              - `model`: The specific model to use for transcription.
 * @param options - Options affecting the behavior of the function, including:
 *                  - `trace`: Trace logging object for debugging and monitoring.
 *                  - `cancellationToken`: Optional, allows cancellation of the operation.
 * @returns A promise that resolves to a transcription result, including:
 *          - `text`: The transcribed text, or undefined if an error occurs.
 *          - `error`: Details of any error encountered.
 */
export async function OpenAITranscribe(
  req: CreateTranscriptionRequest,
  cfg: LanguageModelConfiguration,
  options: TraceOptions & CancellationOptions & RetryOptions,
): Promise<TranscriptionResult> {
  const { trace } = options || {};
  try {
    logVerbose(
      `${cfg.provider}: transcribe ${req.file.type} ${prettyBytes(req.file.size)} with ${cfg.model}`,
    );
    const route = req.translate ? "translations" : "transcriptions";
    const url = `${cfg.base}/audio/${route}`;
    trace?.itemValue(`url`, `[${url}](${url})`);
    trace?.itemValue(`size`, req.file.size);
    trace?.itemValue(`mime`, req.file.type);
    const body = new FormData();
    body.append("model", req.model);
    body.append("response_format", /whisper/.test(req.model) ? "verbose_json" : "json");
    if (req.temperature) body.append("temperature", req.temperature.toString());
    if (req.language) body.append("language", req.language);
    body.append("file", req.file);

    const freq = {
      method: "POST",
      headers: {
        ...getConfigHeaders(cfg),
        Accept: "application/json",
      },
      body: body,
    };
    traceFetchPost(trace, url, freq.headers, freq.body);
    // TODO: switch back to cross-fetch in the future
    const res = await global.fetch(url, freq as any);
    trace?.itemValue(`status`, `${res.status} ${res.statusText}`);
    const j = await res.json();
    if (!res.ok) return { text: undefined, error: j?.error };
    else return j;
  } catch (e) {
    logError(e);
    trace?.error(e);
    return { text: undefined, error: serializeError(e) };
  }
}

/**
 * Generates speech audio from provided text input using the specified configuration and options.
 *
 * @param req - The request payload containing details for generating speech, including:
 *   - model: The model to use for generating speech.
 *   - input: The text input to convert to speech.
 *   - voice: The voice profile to use for speech synthesis (default is "alloy").
 *   - Additional optional parameters for speech customization.
 * @param cfg - The configuration for the language model, including:
 *   - base: Base URL of the API.
 *   - model: Model identifier.
 *   - provider: The provider of the model.
 * @param options - Supplementary options for the request, such as:
 *   - trace: Trace object for logging and debugging.
 *   - cancellationToken: Token to handle cancellation of the operation.
 * @returns A promise that resolves to an object containing:
 *   - audio: The generated speech audio as a Uint8Array, or undefined if an error occurred.
 *   - error: Information about any error that occurred, or undefined if successful.
 */
export async function OpenAISpeech(
  req: CreateSpeechRequest,
  cfg: LanguageModelConfiguration,
  options: TraceOptions & CancellationOptions & RetryOptions,
): Promise<CreateSpeechResult> {
  const { model, input, voice = "alloy", ...rest } = req;
  const { trace } = options || {};
  const fetch = await createFetch(options);
  try {
    logVerbose(`${cfg.provider}: speak with ${cfg.model}`);
    const url = `${cfg.base}/audio/speech`;
    trace?.itemValue(`url`, `[${url}](${url})`);
    const body = {
      model,
      input,
      voice,
      ...rest,
    };
    const freq = {
      method: "POST",
      headers: {
        ...getConfigHeaders(cfg),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    };
    traceFetchPost(trace, url, freq.headers, body);
    // TODO: switch back to cross-fetch in the future
    const res = await fetch(url, freq as any);
    trace?.itemValue(`status`, `${res.status} ${res.statusText}`);
    if (!res.ok) return { audio: undefined, error: (await res.json())?.error };
    const j = await res.arrayBuffer();
    return { audio: new Uint8Array(j) } satisfies CreateSpeechResult;
  } catch (e) {
    logError(e);
    trace?.error(e);
    return {
      audio: undefined,
      error: serializeError(e),
    } satisfies CreateSpeechResult;
  }
}

/**
 * Generates an image using the specified model and prompt.
 *
 * @param req - An object containing the image generation request, including:
 *              - model: The name of the model to use for image generation.
 *              - prompt: The text prompt to generate the image.
 *              - size: Optional; dimensions of the image in "widthxheight" format or keywords like "portrait", "landscape", "square", or "auto". Defaults to "1024x1024".
 *              - quality: Optional; image quality setting ("auto", "high", "hd").
 *              - style: Optional; style attributes for image generation.
 *              - Additional parameters required for the request.
 * @param cfg - The configuration for the language model, including:
 *              - base: Base URL of the API endpoint.
 *              - provider: The provider of the model (e.g., Azure, OpenAI).
 *              - type: The API type being used (e.g., azure, openai).
 *              - model: The model identifier, if required by the provider.
 *              - version: Optional; API version for Azure OpenAI.
 * @param options - Additional options including:
 *                  - trace: Optional; tracing information for debugging/logging.
 *                  - cancellationToken: Optional; token to handle request cancellation.
 * @returns - A result containing either the generated image as a Uint8Array, the revised prompt, usage information, or an error message.
 */
export async function OpenAIImageGeneration(
  req: CreateImageRequest,
  cfg: LanguageModelConfiguration,
  options: TraceOptions & CancellationOptions & RetryOptions,
): Promise<CreateImageResult> {
  const {
    model,
    prompt,
    size = "1024x1024",
    quality,
    style,
    outputFormat,
    mode = "generate",
    image,
    mask,
    ...rest
  } = req;
  const { trace } = options || {};

  // Determine the API endpoint based on mode
  let endpoint = "generations";
  if (mode === "edit") {
    endpoint = "edits";
    if (!image) {
      return {
        image: undefined,
        error: serializeError(new Error("Image is required for edit mode")),
      };
    }
  }

  let url = `${cfg.base}/images/${endpoint}`;

  const isDallE = /^dall-e/i.test(model);
  const isDallE2 = /^dall-e-2/i.test(model);
  const isDallE3 = /^dall-e-3/i.test(model);
  const isGpt = /^gpt-image/i.test(model);

  // For edit mode, we need to use multipart form data
  const isMultipart = mode === "edit";

  // Process parameters common to all modes
  const processedParams = {
    size: size,
    quality: quality,
    style: style,
    outputFormat: outputFormat,
  };

  // Transform size parameter based on model
  if (processedParams.size && processedParams.size !== "auto") {
    if (isDallE3) {
      if (processedParams.size === "portrait") processedParams.size = "1024x1792";
      else if (processedParams.size === "landscape") processedParams.size = "1792x1024";
      else if (processedParams.size === "square") processedParams.size = "1024x1024";
    } else if (isDallE2) {
      if (
        processedParams.size === "portrait" ||
        processedParams.size === "landscape" ||
        processedParams.size === "square"
      )
        processedParams.size = "1024x1024";
    } else if (isGpt) {
      if (processedParams.size === "portrait") processedParams.size = "1024x1536";
      else if (processedParams.size === "landscape") processedParams.size = "1536x1024";
      else if (processedParams.size === "square") processedParams.size = "1024x1024";
    }
  }

  // Transform quality parameter based on model
  if (processedParams.quality && processedParams.quality !== "auto") {
    if (isDallE3 && processedParams.quality === "high") {
      processedParams.quality = "hd";
    } else if (isGpt && processedParams.quality === "hd") {
      processedParams.quality = "high";
    }
  }

  // Filter out parameters that shouldn't be included for certain models
  const shouldIncludeQuality =
    processedParams.quality && processedParams.quality !== "auto" && !isDallE2;
  const shouldIncludeStyle = processedParams.style && isDallE3;
  const shouldIncludeOutputFormat = processedParams.outputFormat && isGpt;
  const shouldIncludeSize = processedParams.size && processedParams.size !== "auto";

  let body: any;
  let headers: any = {
    ...getConfigHeaders(cfg),
  };

  if (isMultipart) {
    // Use FormData for image uploads
    body = new FormData();

    // Add the image file
    const imageBuffer = await resolveBufferLike(image);
    if (!imageBuffer) {
      return {
        image: undefined,
        error: serializeError(new Error("Failed to resolve image buffer")),
      };
    }
    body.append("image", new Blob([imageBuffer], { type: "image/png" }), "image.png");

    // Add mask if provided (only for edit mode)
    if (mode === "edit" && mask) {
      const maskBuffer = await resolveBufferLike(mask);
      if (maskBuffer) {
        body.append("mask", new Blob([maskBuffer], { type: "image/png" }), "mask.png");
      }
    }

    // Add model
    body.append("model", model);

    // Add prompt (required for edit mode)
    if (mode === "edit") {
      body.append("prompt", prompt);
    }

    // Add processed parameters
    if (shouldIncludeSize) {
      body.append("size", processedParams.size);
    }

    if (shouldIncludeQuality) {
      body.append("quality", processedParams.quality);
    }

    if (shouldIncludeStyle) {
      body.append("style", processedParams.style);
    }

    if (shouldIncludeOutputFormat) {
      body.append("output_format", processedParams.outputFormat);
    }

    // Always request b64_json for response format
    body.append("response_format", "b64_json");

    // Don't set Content-Type header for FormData, let the browser set it with boundary
  } else {
    // JSON body for generation mode
    body = {
      model,
      prompt,
      ...rest,
    };

    // Add processed parameters
    if (shouldIncludeSize) {
      body.size = processedParams.size;
    }

    if (shouldIncludeQuality) {
      body.quality = processedParams.quality;
    }

    if (shouldIncludeStyle) {
      body.style = processedParams.style;
    }

    if (shouldIncludeOutputFormat) {
      body.output_format = processedParams.outputFormat;
    }

    if (isDallE) {
      body.response_format = "b64_json";
    }

    headers["Content-Type"] = "application/json";
    body = JSON.stringify(body);
  }

  dbg("%o", {
    mode,
    endpoint,
    quality: isMultipart ? "multipart" : body.quality,
    style: isMultipart ? "multipart" : body.style,
    response_format: isMultipart ? "b64_json" : body.response_format,
    size: isMultipart ? "multipart" : body.size,
  });

  if (cfg.type === "azure") {
    const version = cfg.version || AZURE_OPENAI_API_VERSION;
    trace?.itemValue(`version`, version);
    url = trimTrailingSlash(cfg.base) + "/" + model + `/images/${endpoint}?api-version=${version}`;
  }

  const fetch = await createFetch(options);
  try {
    logInfo(`${mode} image with ${cfg.provider}:${cfg.model} (this may take a while)`);
    const freq = {
      method: "POST",
      headers,
      body,
    };

    trace?.itemValue(`url`, `[${url}](${url})`);
    if (!isMultipart) {
      traceFetchPost(trace, url, freq.headers, JSON.parse(body));
    }

    const res = await fetch(url, freq as any);
    dbg(`response: %d %s`, res.status, res.statusText);
    trace?.itemValue(`status`, `${res.status} ${res.statusText}`);
    if (!res.ok)
      return {
        image: undefined,
        error: (await res.json())?.error || res.statusText,
      };
    const j: ImageGenerationResponse = await res.json();
    dbg(`%O`, j);
    const revisedPrompt = j.data[0]?.revised_prompt;
    if (revisedPrompt) trace?.details(`📷 revised prompt`, j.data[0].revised_prompt);
    const usage = j.usage;
    const buffer = fromBase64(j.data[0].b64_json);
    return {
      image: new Uint8Array(buffer),
      revisedPrompt,
      usage,
    } satisfies CreateImageResult;
  } catch (e) {
    logError(e);
    trace?.error(e);
    return {
      image: undefined,
      error: serializeError(e),
    } satisfies CreateImageResult;
  }
}

/**
 * Executes an embedding request using the specified language model configuration.
 *
 * @param input - The text input to generate embeddings for.
 * @param cfg - Configuration for the language model, including base URL, provider, type, and model details.
 * @param options - Optional parameters including trace for debugging and cancellationToken for request cancellation.
 * @returns An EmbeddingResult object containing the embeddings or error details if the operation fails.
 *
 * This function determines the proper API route based on the model provider type. It constructs a POST request to retrieve embeddings
 * for the given input. Handles response parsing, error checking, and supports cancellation.
 */
export async function OpenAIEmbedder(
  input: string | string[],
  cfg: LanguageModelConfiguration,
  options: TraceOptions & CancellationOptions & RetryOptions,
): Promise<EmbeddingResult> {
  const { trace, cancellationToken } = options || {};
  const { base, provider, type, model } = cfg;
  if (input === undefined) throw new Error("input is required for embedding");
  try {
    const route = "embeddings";
    let url: string;
    const body: EmbeddingCreateParams = { input, model: cfg.model };

    // Determine the URL based on provider type
    if (
      provider === MODEL_PROVIDER_AZURE_OPENAI ||
      provider === MODEL_PROVIDER_AZURE_SERVERLESS_OPENAI ||
      type === "azure" ||
      type === "azure_serverless"
    ) {
      url = `${trimTrailingSlash(base)}/${model}/embeddings?api-version=${AZURE_OPENAI_API_VERSION}`;
      delete body.model;
    } else if (provider === MODEL_PROVIDER_AZURE_SERVERLESS_MODELS) {
      url = base.replace(/^https?:\/\/([^/]+)\/?/, body.model);
      delete body.model;
    } else {
      url = `${base}/${route}`;
    }

    trace?.itemValue(`url`, `[${url}](${url})`);

    const freq = {
      method: "POST",
      headers: {
        ...getConfigHeaders(cfg),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    };
    // traceFetchPost(trace, url, freq.headers, body)
    const first = typeof input === "string" ? input : input[0];
    logVerbose(`${provider}: embedding ${ellipse(first, 44)} with ${model}`);
    const fetch = await createFetch(options);
    checkCancelled(cancellationToken);
    const res = await fetch(url, freq);
    trace?.itemValue(`response`, `${res.status} ${res.statusText}`);

    if (res.status === 429) return { error: "rate limited", status: "rate_limited" };
    else if (res.status < 300) {
      const data = (await res.json()) as EmbeddingCreateResponse;
      return {
        status: "success",
        data: data.data.sort((a, b) => a.index - b.index).map((d) => d.embedding),
        model: data.model,
      };
    } else {
      return { error: res.statusText, status: "error" };
    }
  } catch (e) {
    if (isCancelError(e)) return { status: "cancelled" };
    logError(e);
    trace?.error(e);
    return { status: "error", error: errorMessage(e) };
  }
}

/**
 * Creates a language model configuration compatible with OpenAI-like APIs.
 *
 * @param providerId - Identifier of the model provider.
 * @param options - Optional configuration object.
 * @param options.listModels - Enables listing of available models if true.
 * @param options.transcribe - Enables transcription capabilities if true.
 * @param options.speech - Enables speech synthesis capabilities if true.
 * @param options.imageGeneration - Enables image generation capabilities if true.
 *
 * @returns A frozen object defining the language model with specified capabilities.
 */
export function LocalOpenAICompatibleModel(
  providerId: string,
  options: {
    listModels?: boolean;
    transcribe?: boolean;
    speech?: boolean;
    imageGeneration?: boolean;
  },
) {
  return Object.freeze<LanguageModel>(
    deleteUndefinedValues({
      completer: OpenAIChatCompletion,
      id: providerId,
      listModels: options?.listModels ? OpenAIListModels : undefined,
      transcriber: options?.transcribe ? OpenAITranscribe : undefined,
      speaker: options?.speech ? OpenAISpeech : undefined,
      imageGenerator: options?.imageGeneration ? OpenAIImageGeneration : undefined,
      embedder: OpenAIEmbedder,
    }),
  );
}
