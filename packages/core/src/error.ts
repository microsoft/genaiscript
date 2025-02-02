import { serializeError as rawSerializeError } from "serialize-error"

export function serializeError(
    e: unknown | string | Error | SerializedError
): SerializedError {
    if (e === undefined || e === null) return undefined
    else if (e instanceof Error) {
        const err = rawSerializeError(e, { maxDepth: 3, useToJSON: false })
        const m = /at eval.*<anonymous>:(\d+):(\d+)/.exec(err.stack)
        if (m) {
            err.line = parseInt(m[1])
            err.column = parseInt(m[2])
        }
        return err
    } else if (e instanceof Object) {
        const obj = e as SerializedError
        return obj
    } else if (typeof e === "string") return { message: e }
    else return { message: e.toString?.() }
}

export function errorMessage(e: any, defaultValue: string = "error"): string {
    if (e === undefined || e === null) return undefined
    if (typeof e.messsage === "string") return e.message
    if (typeof e.error === "string") return e.error
    if (typeof e.error === "object" && typeof e.error.message === "string")
        return e.error.message
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
            `LLM error (${status}): ${
                body?.message ? body?.message : statusText
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
