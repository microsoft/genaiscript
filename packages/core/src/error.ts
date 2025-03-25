import { serializeError as rawSerializeError } from "serialize-error"

/**
 * Serializes an error or an error-like object into a standardized format.
 * 
 * This function accepts various types of input, including instances of Error,
 * strings, or generic objects, and transforms them into a serialized error 
 * object. If an Error instance is provided, additional properties such as line 
 * and column numbers from the stack trace are extracted when available.
 * 
 * If the input is undefined or null, the function returns undefined. For 
 * objects, it casts them as SerializedError. If a string is provided, it wraps 
 * it in an object with a message property. For any other type, it converts 
 * the input to a string and wraps it accordingly.
 * 
 * @param e The error or error-like object to serialize.
 * @returns A serialized representation of the error.
 */
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

/**
 * Retrieves the error message from a given error object.
 * 
 * This function checks the input error for specific message formats,
 * providing a default value if no valid message is found.
 * It handles various cases including direct string messages,
 * nested error objects, and serialized error representations.
 * 
 * @param e - The error object or value to extract the message from.
 * @param defaultValue - The fallback message to return if no valid message is found.
 * 
 * @returns A string representing the error message or the default value.
 */
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

/**
 * Determines if the given error is a cancellation error.
 *
 * A cancellation error is defined as an instance of CancelError
 * or an error with the name "AbortError".
 *
 * @param e The error to evaluate.
 * @returns True if the error is a cancellation error, false otherwise.
 */
export function isCancelError(e: Error | SerializedError) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return e?.name === CancelError.NAME || e?.name === "AbortError"
}

/**
 * Determines if the provided error is an instance of RequestError.
 * It can also check against optional status code and error code parameters.
 *
 * @param e - The error to be evaluated.
 * @param statusCode - An optional status code to match.
 * @param code - An optional error code to match.
 * @returns True if the error is a RequestError and matches the optional status code and code; otherwise, false.
 */
export function isRequestError(e: Error, statusCode?: number, code?: string) {
    return (
        e instanceof RequestError &&
        (statusCode === undefined || statusCode === e.status) &&
        (code === undefined || code === e.body?.code)
    )
}
