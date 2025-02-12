import { DatabaseSync } from "node:sqlite"
import { LanguageModel, ListModelsFunction } from "./chat"
import {
    AZURE_OPENAI_API_VERSION,
    MODEL_PROVIDER_AZURE_OPENAI,
} from "./constants"
import { serializeError } from "./error"
import { createFetch } from "./fetch"
import { OpenAIChatCompletion } from "./openai"

const listModels: ListModelsFunction = async (cfg, options) => {
    try {
        // Create a fetch instance to make HTTP requests
        const { base, token } = cfg
        if (!token) throw new Error("Missing token")
        const subscriptionId = process.env.AZURE_OPENAI_SUBSCRIPTION_ID
        const resourceGroupName = process.env.AZURE_OPENAI_RESOURCE_GROUP
        const accountName = /^https:\/\/([^\.]+)\./.exec(base)[1]

        if (!subscriptionId || !resourceGroupName || !accountName)
            throw new Error(
                "Missing subscriptionId, resourceGroupName, or accountName"
            )

        // https://learn.microsoft.com/en-us/rest/api/aiservices/accountmanagement/deployments/list-skus?view=rest-aiservices-accountmanagement-2024-10-01&tabs=HTTP
        const fetch = await createFetch({ retries: 0, ...options })
        const url = `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.CognitiveServices/accounts/${accountName}/deployments/?api-version=2024-10-01`
        const res = await fetch(url, {
            method: "GET",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${token}`,
            },
        })
        if (res.status !== 200)
            return {
                ok: false,
                status: res.status,
                error: serializeError(res.statusText),
            }
        const json: {
            value: {
                id: string
                name: string
                properties: {
                    model: {
                        format: string
                        name: string
                        version: string
                    }
                }
            }[]
        } = await res.json()
        return {
            ok: true,
            models: json.value.map((model) => ({
                id: model.name,
                family: model.properties.model.name,
                details: `${model.properties.model.format} ${model.properties.model.name}`,
                url: `https://ai.azure.com/resource/deployments/${encodeURIComponent(model.id)}`,
                version: model.properties.model.version,
            })),
        }
    } catch (e) {
        return { ok: false, error: serializeError(e) }
    }
}

// Define the Ollama model with its completion handler and model listing function
export const AzureOpenAIModel = Object.freeze<LanguageModel>({
    id: MODEL_PROVIDER_AZURE_OPENAI,
    completer: OpenAIChatCompletion,
    listModels,
})
