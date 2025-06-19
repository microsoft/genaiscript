// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import debug from "debug";
const dbg = debug("genaiscript:models");

import { uniq } from "es-toolkit";
import { errorMessage } from "./error.js";
import { host, ModelConfiguration, runtimeHost } from "./host.js";
import { MarkdownTrace, TraceOptions } from "./trace.js";
import { arrayify } from "./cleaners.js";
import { toStringList } from "./util.js";
import { CancellationOptions } from "./cancellation.js";
import { LanguageModelConfiguration } from "./server/messages.js";
import { roundWithPrecision } from "./precision.js";
import { ChatCompletionReasoningEffort } from "./chattypes.js";
import type { ModelConnectionOptions, ModelOptions } from "./types.js";

export interface ParsedModelType {
  provider: string;
  family: string;
  model: string;
  tag?: string;
  reasoningEffort?: ChatCompletionReasoningEffort;
}

/**
 * Parses a model identifier string in the format:
 * - `provider:model`
 * - `provider:model:tag`
 * - Optionally, `model:tag` can include `:reasoningEffort` (e.g., high, medium, low).
 *
 * Parameters:
 * - id: The model identifier string to parse. Must not be empty.
 *
 * Returns:
 * - An object containing provider, family, model, optional tag, and optional reasoningEffort.
 *
 * Throws:
 * - Error if the model identifier is not specified.
 */
export function parseModelIdentifier(id: string): {
  provider: string;
  family: string;
  model: string;
  tag?: string;
  reasoningEffort?: ChatCompletionReasoningEffort;
} {
  if (!id) throw new Error("Model identifier not specified");
  let reasoningEffort: ChatCompletionReasoningEffort;
  const parts = id.split(":");
  if (/^(high|medium|low)$/.test(parts.at(-1)))
    reasoningEffort = parts.pop() as ChatCompletionReasoningEffort;

  let res: ParsedModelType;
  if (parts.length >= 3)
    res = {
      provider: parts[0],
      family: parts[1],
      tag: parts.slice(2).join(":"),
      model: parts.slice(1).join(":"),
    };
  else if (parts.length === 2) res = { provider: parts[0], family: parts[1], model: parts[1] };
  else res = { provider: id, family: "*", model: "*" };
  if (reasoningEffort) res.reasoningEffort = reasoningEffort;
  return res;
}

export interface ModelConnectionInfo
  extends ModelConnectionOptions,
    Partial<LanguageModelConfiguration> {
  error?: string;
  model: string;
}

/**
 * Creates a detailed trace log for a language model connection.
 *
 * @param trace - The MarkdownTrace instance used for documenting details.
 * @param options - Configuration options for the model connection:
 *   - `model`: The model identifier.
 *   - `temperature`: Sampling temperature for the model.
 *   - `reasoningEffort`: Effort level for reasoning tasks (e.g., high, medium, low).
 *   - `fallbackTools`: Tools used for fallback handling.
 *   - `topP`: Probability mass for nucleus sampling.
 *   - `maxTokens`: Maximum token limit for the response.
 *   - `seed`: Seed value for deterministic outputs.
 *   - `cache`: Whether to use cache during this connection.
 *   - `logprobs`: Number of log probabilities to include.
 *   - `topLogprobs`: Statistics on the top probabilities.
 *   - `responseType`: Type of response expected (e.g., text, JSON schema).
 *   - `responseSchema`: JSON schema for structuring the response.
 *   - `fenceFormat`: Syntax for formatting fenced responses.
 *   - `choices`: Potential candidate options for sampling from the model.
 * @param connectionToken - Metadata related to the model provider:
 *   - `base`: Base configuration identifier.
 *   - `type`: Type specification of the model.
 *   - `version`: Version of the model.
 *   - `source`: Origin of the model configuration.
 *   - `provider`: The associated service provider.
 *
 * Documents data about the model configuration and its behavior, including choices, aliases,
 * and configuration metadata from the runtime environment. Ensures detailed logs for better traceability.
 */
export function traceLanguageModelConnection(
  trace: MarkdownTrace,
  options: ModelOptions,
  connectionToken: LanguageModelConfiguration,
) {
  const {
    model,
    temperature,
    reasoningEffort,
    fallbackTools,
    topP,
    maxTokens,
    seed,
    cache,
    logprobs,
    topLogprobs,
    responseType,
    responseSchema,
    fenceFormat,
  } = options;
  const choices = arrayify(options.choices);
  const { base, type, version, source, provider } = connectionToken;
  trace.startDetails(`⚙️ configuration`);
  try {
    trace.itemValue(`model`, model);
    trace.itemValue(`version`, version);
    trace.itemValue(`source`, source);
    trace.itemValue(`provider`, provider);
    trace.itemValue(`temperature`, temperature);
    trace.itemValue(`reasoningEffort`, reasoningEffort);
    trace.itemValue(`fallbackTools`, fallbackTools);
    trace.itemValue(`topP`, topP);
    trace.itemValue(`maxTokens`, maxTokens);
    trace.itemValue(`base`, base);
    trace.itemValue(`type`, type);
    trace.itemValue(`seed`, seed);
    if (choices.length)
      trace.itemValue(
        `choices`,
        choices
          .map((c) =>
            typeof c === "string" ? c : `${c.token} - ${roundWithPrecision(c.weight, 2)}`,
          )
          .join(","),
      );
    trace.itemValue(`logprobs`, logprobs);
    if (topLogprobs) trace.itemValue(`topLogprobs`, topLogprobs);
    trace.itemValue(`cache`, cache);
    trace.itemValue(`fence format`, fenceFormat);
    trace.itemValue(`response type`, responseType);
    if (responseSchema) trace.detailsFenced(`📦 response schema`, responseSchema, "json");

    trace.startDetails(`🔗 model aliases`);
    Object.entries(runtimeHost.modelAliases).forEach(([key, value]) =>
      trace.itemValue(
        key,
        toStringList(
          `\`${value.model}\``,
          isNaN(value.temperature) ? undefined : `temperature: \`${value.temperature}\``,
          `source: \`${value.source}\``,
        ),
      ),
    );
    trace.endDetails();
  } finally {
    trace.endDetails();
  }
}

/**
 * Determines if the provided model identifier is an alias.
 *
 * @param model - The model identifier to check.
 *
 * @returns True if the given model identifier is an alias, otherwise false.
 */
export function isModelAlias(model: string): boolean {
  const res = !!runtimeHost.modelAliases[model];
  return res;
}

/**
 * Resolves the final model configuration by following a chain of model aliases.
 *
 * Parameters:
 * - model: The model identifier or alias to resolve. Must not be empty.
 *
 * Throws:
 * - Error if the model parameter is not specified.
 * - Error if a circular alias reference is detected.
 *
 * Returns:
 * - The fully resolved ModelConfiguration object, containing the final model identifier and its source.
 */
export function resolveModelAlias(model: string): ModelConfiguration {
  if (!model) throw new Error("Model not specified");
  const { modelAliases } = runtimeHost;
  const seen: string[] = [];
  let res: ModelConfiguration = {
    model,
    source: "script",
  };
  while (modelAliases[res.model]) {
    const next = modelAliases[res.model];
    dbg(`alias ${res.model} -> ${next.model}`);
    if (seen.includes(next.model))
      throw new Error(`Circular model alias: ${next.model}, seen ${[...seen].join(",")}`);
    seen.push(next.model);
    res = next;
  }
  return res;
}

/**
 * Resolves model connection information, including configuration and token.
 *
 * @param conn - The connection options for the model.
 * @param options - An optional object containing:
 *   - model: A specific model identifier to resolve.
 *   - defaultModel: A default model identifier if none is provided.
 *   - token: A boolean indicating whether to include the token in the resolved settings.
 *   - trace: An optional trace object for logging details.
 *   - cancellationToken: An optional token to cancel the operation.
 *
 * @returns An object containing:
 *   - info: Connection information for the resolved model.
 *   - configuration: Optional configuration details for the resolved model.
 *
 * Resolves the model identifier against aliases and retrieves configuration from the host.
 * If candidates are supported, it tries to resolve each candidate until successful.
 * Includes fallback handling for missing or invalid model configurations.
 */
export async function resolveModelConnectionInfo(
  conn: ModelConnectionOptions,
  options?: {
    model?: string;
    defaultModel?: string;
    token?: boolean;
  } & TraceOptions &
    CancellationOptions,
): Promise<{
  info: ModelConnectionInfo;
  configuration?: LanguageModelConfiguration;
}> {
  const { trace, token: askToken, defaultModel, cancellationToken } = options || {};
  const hint = options?.model || conn.model;
  dbg(`resolving model for '${hint || ""}'`);
  // supports candidate if no model hint or hint is a model alias
  const resolved = resolveModelAlias(hint || defaultModel);
  if (!resolved)
    return {
      info: { error: "missing error information", model: undefined },
    };

  const supportsCandidates = !hint || isModelAlias(hint);
  const modelId = resolved.model;
  let candidates = supportsCandidates ? resolved.candidates : undefined;

  const resolveModel = async (
    model: string,
    resolveOptions: { withToken: boolean; reportError: boolean },
  ): Promise<{
    info: ModelConnectionInfo;
    configuration?: LanguageModelConfiguration;
  }> => {
    try {
      dbg(`resolving ${model}`);
      const configuration = await host.getLanguageModelConfiguration(model, {
        token: resolveOptions.withToken,
        cancellationToken,
        trace,
      });
      if (!configuration) {
        dbg(`configuration not found`);
        return { info: { ...conn, model } };
      } else {
        const { token: theToken, ...rest } = configuration;
        return {
          info: {
            ...conn,
            ...rest,
            model,
            token: theToken ? (resolveOptions.withToken ? theToken : "***") : "",
          },
          configuration,
        };
      }
    } catch (e) {
      dbg(`error resolving ${model}: ${e}`);
      if (resolveOptions.reportError) trace?.error(undefined, e);
      return {
        info: {
          ...conn,
          model,
          error: errorMessage(e),
        },
      };
    }
  };

  if (!supportsCandidates) {
    dbg(`candidate ${modelId}`);
    return await resolveModel(modelId, {
      withToken: askToken,
      reportError: true,
    });
  } else {
    candidates = uniq([modelId, ...(candidates || [])].filter((c) => !!c));
    dbg(`candidates: ${candidates?.join(", ")}`);
    for (const candidate of candidates) {
      const res = await resolveModel(candidate, {
        withToken: askToken,
        reportError: false,
      });
      if (!res.info.error && res.info.token) {
        dbg(`resolved ${candidate}`);
        return res;
      }
    }
    debug(`no candidates resolved`);
    return {
      info: {
        model: "?",
        error: hint
          ? `LLM provider not configured or refresh token expired for '${hint}'`
          : "LLM provider not configured or refresh token expired",
      },
    };
  }
}
