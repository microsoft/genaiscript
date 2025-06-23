// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { AnthropicBedrockModel, AnthropicModel } from "./anthropic.js";
import { LanguageModel } from "./chat.js";
import {
  MODEL_PROVIDER_ANTHROPIC,
  MODEL_PROVIDER_ANTHROPIC_BEDROCK,
  MODEL_PROVIDER_GITHUB_COPILOT_CHAT,
  MODEL_PROVIDER_GITHUB,
  MODEL_PROVIDER_LMSTUDIO,
  MODEL_PROVIDER_OLLAMA,
  MODEL_PROVIDER_WHISPERASR,
  MODEL_PROVIDER_AZURE_OPENAI,
  MODEL_PROVIDER_ECHO,
  MODEL_PROVIDER_NONE,
  MODEL_PROVIDER_AZURE_AI_INFERENCE,
} from "./constants.js";
import { runtimeHost } from "./host.js";
import { OllamaModel } from "./ollama.js";
import { LocalOpenAICompatibleModel } from "./openai.js";
import { GitHubModel } from "./github.js";
import { LMStudioModel } from "./lmstudio.js";
import { WhisperAsrModel } from "./whisperasr.js";
import { AzureOpenAIModel } from "./azureopenai.js";
import { EchoModel } from "./echomodel.js";
import { NoneModel } from "./nonemodel.js";
import { AzureAIInferenceModel } from "./azureaiinference.js";
import { providerFeatures } from "./features.js";

/**
 * Resolves and returns a language model based on the provided model provider identifier.
 *
 * @param provider - The identifier of the model provider. It determines which language model to return.
 *                   Supported providers include predefined constants from "./constants".
 *
 * @returns The resolved language model instance corresponding to the specified provider.
 *
 * @throws An error if the provider is MODEL_PROVIDER_GITHUB_COPILOT_CHAT and no client language model is available.
 *         If the provider does not match any predefined constant, a LocalOpenAICompatibleModel is returned with
 *         features derived from the MODEL_PROVIDERS configuration.
 */
export function resolveLanguageModel(provider: string): LanguageModel {
  if (provider === MODEL_PROVIDER_GITHUB_COPILOT_CHAT) {
    const m = runtimeHost.clientLanguageModel;
    if (!m) throw new Error("Github Copilot Chat Models not available");
    return m;
  }
  if (provider === MODEL_PROVIDER_AZURE_OPENAI) return AzureOpenAIModel;
  if (provider === MODEL_PROVIDER_AZURE_AI_INFERENCE) return AzureAIInferenceModel;
  if (provider === MODEL_PROVIDER_GITHUB) return GitHubModel;
  if (provider === MODEL_PROVIDER_OLLAMA) return OllamaModel;
  if (provider === MODEL_PROVIDER_ANTHROPIC) return AnthropicModel;
  if (provider === MODEL_PROVIDER_ANTHROPIC_BEDROCK) return AnthropicBedrockModel;
  if (provider === MODEL_PROVIDER_LMSTUDIO) return LMStudioModel;
  if (provider === MODEL_PROVIDER_WHISPERASR) return WhisperAsrModel;
  if (provider === MODEL_PROVIDER_ECHO) return EchoModel;
  if (provider === MODEL_PROVIDER_NONE) return NoneModel;

  const features = providerFeatures(provider);
  return LocalOpenAICompatibleModel(provider, {
    listModels: features?.listModels !== false,
    transcribe: features?.transcribe,
    speech: features?.speech,
    imageGeneration: features?.imageGeneration,
  });
}
