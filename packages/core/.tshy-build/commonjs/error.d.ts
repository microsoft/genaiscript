import type { SerializedError } from "./types.js";
/**
 * Serializes an error into a standardized format for easier handling.
 *
 * @param e - The input error to serialize. Can accept an unknown value, string, Error, or SerializedError.
 *   - If `undefined` or `null`, returns `undefined`.
 *   - If an instance of `Error`, serializes it using a custom depth and includes line and column details from the stack trace if available.
 *   - If an object, converts it into a SerializedError.
 *   - If a string, wraps it as the `message` property of a SerializedError.
 *   - For other types, attempts to stringify and include as the `message` property.
 * @returns The serialized error with standardized properties or `undefined` for nullish input.
 */
export declare function serializeError(e: unknown | string | Error | SerializedError): SerializedError;
/**
 * Extracts the error message from an error-like object or returns a default value.
 *
 * @param e The error object to extract the message from. Can be an instance of `Error`, an object, or other error-like structures.
 * @param defaultValue The default message to return if no message can be extracted. Defaults to "error".
 * @returns The extracted error message or the `defaultValue` if none is found.
 */
export declare function errorMessage(e: any, defaultValue?: string): string;
export declare class CancelError extends Error {
    static readonly NAME = "CancelError";
    constructor(message: string);
}
export declare class NotSupportedError extends Error {
    static readonly NAME = "NotSupportedError";
    constructor(message: string);
}
export declare class RequestError extends Error {
    readonly status: number;
    readonly statusText: string;
    readonly body: any;
    readonly bodyText?: string;
    readonly retryAfter?: number;
    static readonly NAME = "RequestError";
    constructor(status: number, statusText: string, body: any, bodyText?: string, retryAfter?: number);
}
/**
 * Determines if the given error is a cancellation-related error.
 *
 * @param e - The error object to evaluate. Can be an Error or a SerializedError.
 *            It is checked to determine if it matches the name of a CancelError
 *            or an AbortError.
 * @returns Boolean indicating whether the error is categorized as a cancellation error.
 */
export declare function isCancelError(e: Error | SerializedError): boolean;
/**
 * Determines if the given error is an instance of RequestError and optionally checks its status and code.
 *
 * @param e - The error object to evaluate.
 * @param statusCode - Optional. A specific HTTP status code to check against the error's status.
 * @param code - Optional. A specific error code to check against the error's body.
 * @returns True if the error is a RequestError and matches the optional status and code, otherwise false.
 */
export declare function isRequestError(e: Error, statusCode?: number, code?: string): boolean;
//# sourceMappingURL=error.d.ts.map