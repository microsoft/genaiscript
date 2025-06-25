// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import debug from "debug";
const dbg = debug("genaiscript:azureopenai");
import { LanguageModel, ListModelsFunction } from "./chat.js";
import { AZURE_MANAGEMENT_API_VERSION, MODEL_PROVIDER_AZURE_OPENAI } from "./constants.js";
import { errorMessage, serializeError } from "./error.js";
import { createFetch } from "./fetch.js";
import {
  OpenAIChatCompletion,
  OpenAIEmbedder,
  OpenAIImageGeneration,
  OpenAIListModels,
  OpenAISpeech,
  OpenAITranscribe,
} from "./openai.js";
import { runtimeHost } from "./host.js";

const azureManagementOrOpenAIListModels: ListModelsFunction = async (cfg, options) => {
  const modelsApi = process.env.AZURE_OPENAI_API_MODELS_TYPE;
  if (modelsApi === "openai") {
    dbg("using OpenAI API for model listing");
    return await OpenAIListModels(cfg, options);
  } else {
    dbg("using Azure Management API for model listing");
    return await azureManagementListModels(cfg, options);
  }
};

const azureManagementListModels: ListModelsFunction = async (cfg, options) => {
  try {
    // Create a fetch instance to make HTTP requests
    const { base } = cfg;
    const subscriptionId = process.env.AZURE_OPENAI_SUBSCRIPTION_ID;
    let resourceGroupName = process.env.AZURE_OPENAI_RESOURCE_GROUP;
    const accountName = /^https:\/\/([^.]+)\./.exec(base)[1];

    if (!subscriptionId || !accountName) {
      dbg("subscriptionId or accountName is missing, returning an empty model list");
      return { ok: true, models: [] };
    }
    const token = await runtimeHost.azureManagementToken.token("default", options);
    if (!token) throw new Error("Azure management token is missing");
    if (token.error) {
      dbg("error occurred while fetching Azure management token: %s", token.error);
      throw new Error(errorMessage(token.error));
    }

    const fetch = await createFetch({ retries: 0, ...options });
    const get = async (url: string) => {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token.token.token}`,
        },
      });
      if (res.status !== 200) {
        return {
          ok: false,
          status: res.status,
          error: serializeError(res.statusText),
        };
      }
      return await res.json();
    };

    if (!resourceGroupName) {
      dbg("resourceGroupName is missing, fetching resource details");
      const resources: {
        value: {
          id: string;
          name: string;
          type: "OpenAI";
        }[];
      } = await get(
        `https://management.azure.com/subscriptions/${subscriptionId}/resources?api-version=2021-04-01`,
      );
      const resource = resources.value.find((r) => r.name === accountName);
      resourceGroupName = /\/resourceGroups\/([^/]+)\/providers\//.exec(resource?.id)[1];
      if (!resourceGroupName) {
        dbg("unable to extract resource group name from resource id");
        throw new Error("Resource group not found");
      }
    }

    // https://learn.microsoft.com/en-us/rest/api/aiservices/accountmanagement/deployments/list-skus?view=rest-aiservices-accountmanagement-2024-10-01&tabs=HTTP
    const deployments: {
      value: {
        id: string;
        name: string;
        properties: {
          model: {
            format: string;
            name: string;
            version: string;
          };
        };
      }[];
    } = await get(
      `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.CognitiveServices/accounts/${accountName}/deployments/?api-version=${AZURE_MANAGEMENT_API_VERSION}`,
    );
    return {
      ok: true,
      models: deployments.value.map((model) => ({
        id: model.name,
        family: model.properties.model.name,
        details: `${model.properties.model.format} ${model.properties.model.name}`,
        url: `https://ai.azure.com/resource/deployments/${encodeURIComponent(model.id)}`,
        version: model.properties.model.version,
      })),
    };
  } catch (e) {
    return { ok: false, error: serializeError(e) };
  }
};

// Define the Ollama model with its completion handler and model listing function
export const AzureOpenAIModel = Object.freeze<LanguageModel>({
  id: MODEL_PROVIDER_AZURE_OPENAI,
  completer: OpenAIChatCompletion,
  listModels: azureManagementOrOpenAIListModels,
  transcriber: OpenAITranscribe,
  speaker: OpenAISpeech,
  imageGenerator: OpenAIImageGeneration,
  embedder: OpenAIEmbedder,
});
