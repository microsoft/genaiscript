import {
    serializeError as rawSerializeError,
    ErrorObject as RawErrorObject,
} from "serialize-error"

export type ErrorObject = RawErrorObject

export function serializeError(
    e: unknown | string | Error | ErrorObject
): ErrorObject {
    if (e instanceof Error)
        return rawSerializeError(e, { maxDepth: 3, useToJSON: false })
    else if (e instanceof Object) {
        const obj = e as ErrorObject
        return obj
    } else if (typeof e === "string") return { message: e }
    else if (e !== undefined && e !== null) return { message: e.toString?.() }
    else return {}
}

export class CancelError extends Error {
    constructor(message: string) {
        super(message)
        this.name = "CancelError"
    }
}

export class NotSupportedError extends Error {
    constructor(message: string) {
        super(message)
        this.name = "NotSupportedError"
    }
}

export class RequestError extends Error {
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
    }
}

export function isCancelError(e: Error | ErrorObject) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return e?.name === "CancelError" || e?.name === "AbortError"
}

export function isTokenError(e: Error) {
    return isRequestError(e, 403)
}

export function isRequestError(e: Error, statusCode?: number, code?: string) {
    return (
        e instanceof RequestError &&
        (statusCode === undefined || statusCode === e.status) &&
        (code === undefined || code === e.body?.code)
    )
}
