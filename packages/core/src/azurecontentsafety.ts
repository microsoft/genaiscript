import { createFetch } from "./fetch"
import { TraceOptions } from "./trace"
import { chunkString, trimTrailingSlash } from "./util"
import { AZURE_CONTENT_SAFETY_PROMPT_SHIELD_MAX_LENGTH } from "./constants"
import { AuthenticationToken, AzureCredentialsType, runtimeHost } from "./host"

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
    constructor(
        readonly options?: TraceOptions & {
            signal?: AbortSignal
        }
    ) {}

    async detectPromptInjection(content: {
        userPrompt?: string
        documents?: string[]
    }): Promise<{ attackDetected: boolean }> {
        const route = "text:shieldPrompt"
        const fetcher = await this.createClient(route)

        const shieldPrompt = async (content: AzureContentSafetyRequest) => {
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
    }

    private async createClient(route: string) {
        const { signal } = this.options || {}
        const endpoint = trimTrailingSlash(
            process.env.AZURE_CONTENT_SAFETY_ENDPOINT
        )
        const credentialsType =
            (process.env.AZURE_CONTENT_SAFETY_CREDENTIALS_TYPE?.toLowerCase()?.trim() ||
                "default") as AzureCredentialsType
        const subscriptionKey =
            process.env.AZURE_CONTENT_SAFETY_KEY ||
            (await runtimeHost.azureToken.token(credentialsType))?.token
        const version = process.env.AZURE_CONTENT_SAFETY_VERSION || "2024-09-01"

        if (!endpoint)
            throw new Error("AZURE_CONTENT_SAFETY_ENDPOINT is not set")
        if (!subscriptionKey)
            throw new Error(
                "AZURE_CONTENT_SAFETY_KEY is not set or not signed in with Azure"
            )

        const headers = {
            "Ocp-Apim-Subscription-Key": subscriptionKey,
            "Content-Type": "application/json",
            "User-Agent": "genaiscript",
        }
        const fetch = await createFetch(this.options)
        const url = `${endpoint}/contentsafety/${route}?api-version=${version}`
        const fetcher = async (body: any) =>
            await fetch(url, {
                method: "POST",
                headers,
                body: JSON.stringify(body),
                signal,
            })
        return fetcher
    }
}

export async function createAzureContentSafetyClient(
    options: TraceOptions & {
        signal?: AbortSignal
    }
): Promise<ContentSafety> {
    return new AzureContentSafetyClient(options)
}
