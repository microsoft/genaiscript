import crossFetch from "cross-fetch"
import wrapFetch from "fetch-retry"
import { MarkdownTrace, TraceOptions } from "./trace"
import {
    FETCH_RETRY_DEFAULT,
    FETCH_RETRY_DEFAULT_DEFAULT,
    FETCH_RETRY_GROWTH_FACTOR,
    FETCH_RETRY_MAX_DELAY_DEFAULT,
} from "./constants"
import { errorMessage } from "./error"
import { logVerbose, roundWithPrecision, toStringList } from "./util"
import { CancellationToken } from "./cancellation"
import { readText } from "./fs"

export async function createFetch(
    options?: {
        retryOn?: number[]
        retries?: number
        retryDelay?: number
        maxDelay?: number
        cancellationToken?: CancellationToken
    } & TraceOptions
) {
    const {
        retries = FETCH_RETRY_DEFAULT,
        retryOn = [429, 500],
        trace,
        retryDelay = FETCH_RETRY_DEFAULT_DEFAULT,
        maxDelay = FETCH_RETRY_MAX_DELAY_DEFAULT,
        cancellationToken,
    } = options || {}

    if (!retryOn?.length) return crossFetch

    const fetchRetry = await wrapFetch(crossFetch, {
        retryOn,
        retries,
        retryDelay: (attempt, error, response) => {
            const code: string = (error as any)?.code as string
            if (
                code === "ECONNRESET" ||
                code === "ENOTFOUND" ||
                cancellationToken?.isCancellationRequested
            )
                // fatal
                return undefined

            const message = errorMessage(error)
            const status = statusToMessage(response)
            const delay =
                Math.min(
                    maxDelay,
                    Math.pow(FETCH_RETRY_GROWTH_FACTOR, attempt) * retryDelay
                ) *
                (1 + Math.random() / 20) // 5% jitter
            const msg = toStringList(
                `retry #${attempt + 1} in ${roundWithPrecision(Math.floor(delay) / 1000, 1)}s`,
                message,
                status
            )
            logVerbose(msg)
            trace?.resultItem(false, msg)
            return delay
        },
    })
    return fetchRetry
}

export async function fetchText(
    urlOrFile: string | WorkspaceFile,
    fetchOptions?: FetchTextOptions
) {
    if (typeof urlOrFile === "string") {
        urlOrFile = {
            filename: urlOrFile,
            content: "",
        }
    }
    const url = urlOrFile.filename
    let ok = false
    let status = 404
    let text: string
    if (/^https?:\/\//i.test(url)) {
        const fetch = await createFetch()
        const resp = await fetch(url, fetchOptions)
        ok = resp.ok
        status = resp.status
        if (ok) text = await resp.text()
    } else {
        try {
            text = await readText("workspace://" + url)
            ok = true
        } catch (e) {
            logVerbose(e)
            ok = false
            status = 404
        }
    }
    const file: WorkspaceFile = {
        filename: urlOrFile.filename,
        content: text,
    }
    return {
        ok,
        status,
        text,
        file,
    }
}

export function traceFetchPost(
    trace: MarkdownTrace,
    url: string,
    headers: Record<string, string>,
    body: any,
    options?: { showAuthorization?: boolean }
) {
    const { showAuthorization } = options || {}
    headers = { ...(headers || {}) }
    if (!showAuthorization)
        Object.entries(headers)
            .filter(([k]) => /^(authorization|api-key)$/i.test(k))
            .forEach(
                ([k]) =>
                    (headers[k] = /Bearer /i.test(headers[k])
                        ? "Bearer ***"
                        : "***")
            )
    const cmd = `curl ${url} \\
-H  "Content-Type: application/json" \\
${Object.entries(headers)
    .map(([k, v]) => `-H "${k}: ${v}"`)
    .join("\\\n")} \\
-d '${JSON.stringify(body, null, 2).replace(/'/g, "'\\''")}' 
`
    if (trace) trace.detailsFenced(`✉️ fetch`, cmd, "bash")
    else logVerbose(cmd)
}

export function statusToMessage(res?: {
    status?: number
    statusText?: string
}) {
    const { status, statusText } = res || {}
    return toStringList(
        typeof status === "number" ? status + "" : undefined,
        statusText
    )
}
