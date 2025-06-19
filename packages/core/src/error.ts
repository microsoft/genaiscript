import { serializeError as rawSerializeError } from "serialize-error";
import debug from "debug";
const dbg = debug("genaiscript:error");

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
export function serializeError(e: unknown | string | Error | SerializedError): SerializedError {
  if (e === undefined || e === null) return undefined;
  else if (e instanceof Error) {
    const err = rawSerializeError(e, { maxDepth: 3, useToJSON: false });
    const m = /at eval.*<anonymous>:(\d+):(\d+)/.exec(err.stack);
    if (m) {
      err.line = parseInt(m[1]);
      err.column = parseInt(m[2]);
    }
    dbg("%O", err);
    return err;
  } else if (e instanceof Object) {
    const obj = e as SerializedError;
    return obj;
  } else if (typeof e === "string") return { message: e };
  else return { message: e.toString?.() };
}

/**
 * Extracts the error message from an error-like object or returns a default value.
 *
 * @param e The error object to extract the message from. Can be an instance of `Error`, an object, or other error-like structures.
 * @param defaultValue The default message to return if no message can be extracted. Defaults to "error".
 * @returns The extracted error message or the `defaultValue` if none is found.
 */
export function errorMessage(e: any, defaultValue: string = "error"): string {
  if (e === undefined || e === null) return undefined;
  if (typeof e.messsage === "string") return e.message;
  if (typeof e.error === "string") return e.error;
  if (typeof e.error === "object" && typeof e.error.message === "string") return e.error.message;
  const ser = serializeError(e);
  return ser?.message ?? ser?.name ?? defaultValue;
}

export class CancelError extends Error {
  static readonly NAME = "CancelError";
  constructor(message: string) {
    super(message);
    this.name = CancelError.NAME;
  }
}

export class NotSupportedError extends Error {
  static readonly NAME = "NotSupportedError";
  constructor(message: string) {
    super(message);
    this.name = NotSupportedError.NAME;
  }
}

export class RequestError extends Error {
  static readonly NAME = "RequestError";
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly body: any,
    public readonly bodyText?: string,
    readonly retryAfter?: number,
  ) {
    super(`LLM error (${status}): ${body?.message ? body?.message : statusText}`);
    this.name = "RequestError";
  }
}

/**
 * Determines if the given error is a cancellation-related error.
 *
 * @param e - The error object to evaluate. Can be an Error or a SerializedError.
 *            It is checked to determine if it matches the name of a CancelError
 *            or an AbortError.
 * @returns Boolean indicating whether the error is categorized as a cancellation error.
 */
export function isCancelError(e: Error | SerializedError) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return e?.name === CancelError.NAME || e?.name === "AbortError";
}

/**
 * Determines if the given error is an instance of RequestError and optionally checks its status and code.
 *
 * @param e - The error object to evaluate.
 * @param statusCode - Optional. A specific HTTP status code to check against the error's status.
 * @param code - Optional. A specific error code to check against the error's body.
 * @returns True if the error is a RequestError and matches the optional status and code, otherwise false.
 */
export function isRequestError(e: Error, statusCode?: number, code?: string) {
  return (
    e instanceof RequestError &&
    (statusCode === undefined || statusCode === e.status) &&
    (code === undefined || code === e.body?.code)
  );
}
