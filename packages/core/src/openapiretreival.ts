import type { paths } from "./openapi"
import { Host, RetreivalService, host } from "./host"
import createClient from "openapi-fetch"

export class OpenAPIRetreivalService implements RetreivalService {
    constructor(readonly host: Host) {}

    private async createRetreivalClient() {
        const token = await this.host.readSecret("RETREIVAL_TOKEN")
        if (!token) throw new Error("RETREIVAL_TOKEN not found")

        const baseUrl =
            (await host.readSecret("RETREIVAL_BASE_URL")) ||
            "http://127.0.0.1:8000"
        const fetcher = createClient<paths>({
            baseUrl,
            headers: {
                Authorization: `Bearer ${token}`,
            },
        })
        return fetcher
    }

    async init() {
        // ping?
    }

    async clear() {
        return { ok: false, error: "not implemented" }
    }

    async upsert(filenameOrUrl: string, content: Blob) {
        const fetcher = await this.createRetreivalClient()
        const { response } = await fetcher.POST("/upsert-file", {
            headers: {
                "Content-Type": "multipart/form-data",
            },
            body: {
                id: filenameOrUrl,
                file: content as any as string,
            },
            bodySerializer(body) {
                const fd = new FormData()
                for (const [k, v] of Object.entries(body)) {
                    fd.append(k, v)
                }
                return fd
            },
        })
        const { ok, status, statusText } = response
        return { ok, status, error: !ok ? statusText : undefined }
    }

    async search(text: string) {
        const fetcher = await this.createRetreivalClient()
        const { response, data } = await fetcher.POST("/query", {
            body: {
                queries: [
                    {
                        query: text,
                        filter: {},
                    },
                ],
            },
        })
        const { ok, status, statusText } = response
        const results =
            data?.results?.[0]?.results?.map(
                ({ id, text, score, metadata }) => ({
                    filename: metadata?.url || metadata?.document_id,
                    id,
                    text,
                    score,
                })
            ) || []
        return { ok, status, error: !ok ? statusText : undefined, results }
    }
}
