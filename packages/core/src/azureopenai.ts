import { LanguageModel, ListModelsFunction } from "./chat"
import {
    AZURE_MANAGEMENT_API_VERSION,
    MODEL_PROVIDER_AZURE_OPENAI,
} from "./constants"
import { errorMessage, serializeError } from "./error"
import { createFetch } from "./fetch"
import { OpenAIChatCompletion } from "./openai"
import { createAzureTokenResolver } from "./azuretoken"

const listModels: ListModelsFunction = async (cfg, options) => {
    try {
        // Create a fetch instance to make HTTP requests
        const { base } = cfg
        const subscriptionId = process.env.AZURE_OPENAI_SUBSCRIPTION_ID
        let resourceGroupName = process.env.AZURE_OPENAI_RESOURCE_GROUP
        const accountName = /^https:\/\/([^\.]+)\./.exec(base)[1]

        if (!subscriptionId || !accountName)
            throw new Error(
                "Missing subscriptionId, resourceGroupName, or accountName"
            )

        const tokenResolver = createAzureTokenResolver(
            "Azure Management",
            "AZURE_MANAGEMENT_TOKEN_SCOPES",
            ["https://management.azure.com/.default"]
        )
        const token = await tokenResolver.token("default", options)
        if (token.error) throw new Error(errorMessage(token.error))

        const fetch = await createFetch({ retries: 0, ...options })
        const get = async (url: string) => {
            const res = await fetch(url, {
                method: "GET",
                headers: {
                    Accept: "application/json",
                    Authorization: `Bearer ${token.token.token}`,
                },
            })
            if (res.status !== 200)
                return {
                    ok: false,
                    status: res.status,
                    error: serializeError(res.statusText),
                }
            return await res.json()
        }

        if (!resourceGroupName) {
            const resources: {
                value: {
                    id: string
                    name: string
                    type: "OpenAI"
                }[]
            } = await get(
                `https://management.azure.com/subscriptions/${subscriptionId}/resources?api-version=2021-04-01`
            )
            const resource = resources.value.find((r) => r.name === accountName)
            resourceGroupName = /\/resourceGroups\/([^\/]+)\/providers\//.exec(
                resource?.id
            )[1]
            if (!resourceGroupName) throw new Error("Resource group not found")
        }

        // https://learn.microsoft.com/en-us/rest/api/aiservices/accountmanagement/deployments/list-skus?view=rest-aiservices-accountmanagement-2024-10-01&tabs=HTTP
        const deployments: {
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
        } = await get(
            `https://management.azure.com/subscriptions/${subscriptionId}/resourceGroups/${resourceGroupName}/providers/Microsoft.CognitiveServices/accounts/${accountName}/deployments/?api-version=${AZURE_MANAGEMENT_API_VERSION}`
        )
        return {
            ok: true,
            models: deployments.value.map((model) => ({
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
