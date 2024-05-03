import { serializeError as rawSerializeError } from "serialize-error"

export function serializeError(
    e: unknown | string | Error | SerializedError
): SerializedError {
    if (e === undefined || e === null) return {}
    else if (e instanceof Error)
        return rawSerializeError(e, { maxDepth: 3, useToJSON: false })
    else if (e instanceof Object) {
        const obj = e as SerializedError
        return obj
    } else if (typeof e === "string") return { message: e }
    else if (e !== undefined && e !== null) return { message: e.toString?.() }
    else return {}
}

export function errorMessage(e: any, defaultValue: string = "error"): string {
    if (e === undefined || e === null) return undefined

    const ser = serializeError(e)
    return ser?.message ?? ser?.name ?? defaultValue
}

export class CancelError extends Error {
    static readonly NAME = "CancelError"
    constructor(message: string) {
        super(message)
        this.name = CancelError.NAME
    }
}

export class NotSupportedError extends Error {
    static readonly NAME = "NotSupportedError"
    constructor(message: string) {
        super(message)
        this.name = NotSupportedError.NAME
    }
}

export class RequestError extends Error {
    static readonly NAME = "RequestError"
    constructor(
        public readonly status: number,
        public readonly statusText: string,
        public readonly body: any,
        public readonly bodyText?: string,
        readonly retryAfter?: number
    ) {
        super(
            `LLM error: ${
                body?.message ? body?.message : `${statusText} (${status})`
            }`
        )
        this.name = "RequestError"
    }
}

export function isCancelError(e: Error | SerializedError) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return e?.name === CancelError.NAME || e?.name === "AbortError"
}

export function isRequestError(e: Error, statusCode?: number, code?: string) {
    return (
        e instanceof RequestError &&
        (statusCode === undefined || statusCode === e.status) &&
        (code === undefined || code === e.body?.code)
    )
}
