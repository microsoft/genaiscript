import { RequestError } from "./chat"
import { serializeError as rawSerializeError } from 'serialize-error';

export interface ErrorObject {
    name?: string;
    message?: string;
    stack?: string;
    cause?: unknown;
    code?: string;
};

export function serializeError(e: unknown | string | Error | ErrorObject): ErrorObject {
    if (e instanceof Error)
        return rawSerializeError(e, { maxDepth: 3 })
    else if (e instanceof Object) {
        const obj = e as ErrorObject
        return {
            name: obj.name,
            message: obj.message,
            stack: obj.stack,
            cause: obj.cause,
            code: obj.code
        }
    } else if (typeof e === "string")
        return { message: e }
    else if (e !== undefined && e !== null)
        return { message: e.toString?.() }
    else return {}
}

export class CancelError extends Error {
    constructor(message: string) {
        super(message)
        this.name = "CancelError"
    }
}

export function createCancelError(msg: string): CancelError {
    const e = new CancelError(msg)
    return e
}

export function isCancelError(e: Error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return e.name === "CancelError" || e.name === "AbortError"
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

export class NotSupportedError extends Error {
    constructor(message: string, options?: ErrorOptions) {
        super(message)
        this.name = "NotSupportedError"
    }
}
