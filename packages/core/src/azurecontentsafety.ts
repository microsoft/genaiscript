import { createFetch, traceFetchPost } from "./fetch"
import { AbortSignalOptions, TraceOptions } from "./trace"
import { chunkString, trimTrailingSlash } from "./util"
import {
    AZURE_CONTENT_SAFETY_PROMPT_SHIELD_MAX_LENGTH,
    DOCS_CONFIGURATION_CONTENT_SAFETY_URL,
} from "./constants"
import { AzureCredentialsType, runtimeHost } from "./host"
import { CancellationOptions } from "./cancellation"
import { YAMLStringify } from "./yaml"

interface AzureContentSafetyRequest {
    userPrompt?: string
    documents?: string[]
}

interface AzureContentSafetyResponse {
    userPromptAnalysis: {
        attackDetected: boolean
    }
    documentsAnalysis: {
        attackDetected: boolean
    }[]
}

class AzureContentSafetyClient implements ContentSafety {
    constructor(readonly options?: TraceOptions & AbortSignalOptions) {}

    async detectPromptInjection(content: {
        userPrompt?: string
        documents?: string[]
    }): Promise<{ attackDetected: boolean }> {
        const { trace } = this.options || {}
        const route = "text:shieldPrompt"

        try {
            trace?.startDetails("🛡️ content safety: shield prompt")

            const fetcher = await this.createClient(route)
            const shieldPrompt = async (content: AzureContentSafetyRequest) => {
                trace?.fence(YAMLStringify(content), "yaml")
                const res = await fetcher(content)
                if (!res.ok)
                    throw new Error(
                        `Azure Content Safety API failed with status ${res.status}`
                    )
                const resBody = (await res.json()) as AzureContentSafetyResponse
                const attackDetected =
                    !!resBody.userPromptAnalysis?.attackDetected ||
                    resBody.documentsAnalysis?.some((doc) => doc.attackDetected)
                return { attackDetected }
            }

            // https://learn.microsoft.com/en-us/azure/ai-services/content-safety/overview#input-requirements
            // Maximum prompt length: 10K characters.
            // Up to five documents with a total of 10K characters.
            for (const userPrompt of chunkString(
                content.userPrompt || "",
                AZURE_CONTENT_SAFETY_PROMPT_SHIELD_MAX_LENGTH
            )) {
                const res = await shieldPrompt({ userPrompt, documents: [] })
                if (res.attackDetected) return res
            }
            const documents = (content.documents || []).join("\n")
            for (const document of chunkString(
                documents,
                AZURE_CONTENT_SAFETY_PROMPT_SHIELD_MAX_LENGTH
            )) {
                const res = await shieldPrompt({
                    userPrompt: "",
                    documents: [document],
                })
                if (res.attackDetected) return res
            }
            return { attackDetected: false }
        } finally {
            trace?.endDetails()
        }
    }

    private async createClient(
        route: string,
        options?: { signal?: AbortSignal }
    ) {
        const { signal, trace } = this.options || {}
        const endpoint = trimTrailingSlash(
            process.env.AZURE_CONTENT_SAFETY_ENDPOINT ||
                process.env.AZURE_CONTENT_SAFETY_API_ENDPOINT
        )
        const credentialsType = ((
            process.env.AZURE_CONTENT_SAFETY_CREDENTIALS_TYPE ||
            process.env.AZURE_CONTENT_SAFETY_API_CREDENTIALS_TYPE
        )
            ?.toLowerCase()
            ?.trim() || "default") as AzureCredentialsType
        let apiKey =
            process.env.AZURE_CONTENT_SAFETY_KEY ||
            process.env.AZURE_CONTENT_SAFETY_API_KEY
        let apiToken: string
        if (!apiKey) {
            const token = await runtimeHost.azureToken.token(
                credentialsType,
                options
            )
            apiToken = token.token
        }
        const version = process.env.AZURE_CONTENT_SAFETY_VERSION || "2024-09-01"

        if (!endpoint)
            throw new Error(
                `AZURE_CONTENT_SAFETY_ENDPOINT is not set. See ${DOCS_CONFIGURATION_CONTENT_SAFETY_URL} for help.`
            )
        if (!apiKey && !apiToken)
            throw new Error(
                `AZURE_CONTENT_SAFETY_KEY is not set or not signed in with Azure. See ${DOCS_CONFIGURATION_CONTENT_SAFETY_URL} for help.`
            )

        const headers: Record<string, string> = {
            "Content-Type": "application/json",
            "User-Agent": "genaiscript",
        }
        if (apiKey) headers["Ocp-Apim-Subscription-Key"] = apiKey
        if (apiToken) headers["Authorization"] = `Bearer ${apiToken}`

        const fetch = await createFetch(this.options)
        const url = `${endpoint}/contentsafety/${route}?api-version=${version}`
        const fetcher = async (body: any) => {
            traceFetchPost(trace, url, headers, body)
            return await fetch(url, {
                method: "POST",
                headers,
                body: JSON.stringify(body),
                signal,
            })
        }
        return fetcher
    }
}

export function createAzureContentSafetyClient(
    options: CancellationOptions &
        TraceOptions & {
            signal?: AbortSignal
        }
): ContentSafety {
    return new AzureContentSafetyClient(options)
}
