import { createFetch, traceFetchPost } from "./fetch"
import { AbortSignalOptions, TraceOptions } from "./trace"
import { arrayify, chunkString, trimTrailingSlash } from "./util"
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

    async detectHarmfulContent(
        content: Awaitable<string | WorkspaceFile>,
        options?: {
            maxAllowedSeverity?: number
        }
    ): Promise<{
        harmfulContentDetected: boolean
        filename?: string
        chunk?: string
    }> {
        const { trace } = this.options || {}
        const { maxAllowedSeverity = 0 } = options || {}
        const route = "text:analyze"

        try {
            trace?.startDetails("🛡️ content safety: detect harmful content")

            const fetcher = await this.createClient(route)
            const analyze = async (text: string) => {
                trace?.fence(YAMLStringify(text), "yaml")
                const res = await fetcher({ text })
                if (!res.ok)
                    throw new Error(
                        `Azure Content Safety API failed with status ${res.status}`
                    )
                const resBody = (await res.json()) as {
                    blockslistMath: string[]
                    categoriesAnalysis: { category: string; severity: number }[]
                }
                const harmfulContentDetected = resBody.categoriesAnalysis?.some(
                    ({ severity }) => severity > maxAllowedSeverity
                )
                return { harmfulContentDetected, ...resBody }
            }

            const inputs = arrayify(await content)
            for (const input of inputs) {
                const text = typeof input === "string" ? input : input.content
                const filename =
                    typeof input === "string" ? undefined : input.filename
                for (const chunk of chunkString(
                    text,
                    AZURE_CONTENT_SAFETY_PROMPT_SHIELD_MAX_LENGTH
                )) {
                    const res = await analyze(chunk)
                    if (res.harmfulContentDetected)
                        return {
                            ...res,
                            filename,
                            chunk,
                        }
                }
            }
            return { harmfulContentDetected: false }
        } finally {
            trace?.endDetails()
        }
    }

    async detectPromptInjection(
        content: Awaitable<
            ElementOrArray<string> | ElementOrArray<WorkspaceFile>
        >
    ): Promise<{ attackDetected: boolean; filename?: string; chunk?: string }> {
        const { trace } = this.options || {}
        const route = "text:shieldPrompt"

        try {
            trace?.startDetails("🛡️ content safety: detect prompt injection")

            const input = arrayify(await content)
            const userPrompts = input.filter((i) => typeof i === "string")
            const documents = input.filter((i) => typeof i === "object")

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

            for (const userPrompt of userPrompts) {
                for (const chunk of chunkString(
                    userPrompt,
                    AZURE_CONTENT_SAFETY_PROMPT_SHIELD_MAX_LENGTH
                )) {
                    const res = await shieldPrompt({
                        userPrompt: chunk,
                        documents: [],
                    })
                    if (res.attackDetected)
                        return {
                            ...res,
                            chunk,
                        }
                }
            }
            for (const document of documents) {
                for (const chunk of chunkString(
                    document.content,
                    AZURE_CONTENT_SAFETY_PROMPT_SHIELD_MAX_LENGTH
                )) {
                    const res = await shieldPrompt({
                        userPrompt: "",
                        documents: [chunk],
                    })
                    if (res.attackDetected)
                        return {
                            ...res,
                            filename: document.filename,
                            chunk,
                        }
                }
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
