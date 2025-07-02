// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import wrapFetch from "fetch-retry";
import { TraceOptions } from "./trace.js";
import {
  FETCH_RETRY_DEFAULT,
  FETCH_RETRY_DEFAULT_DEFAULT,
  FETCH_RETRY_GROWTH_FACTOR,
  FETCH_RETRY_MAX_DELAY_DEFAULT,
  FETCH_RETRY_MAX_RETRY_AFTER_DEFAULT,
  FETCH_RETRY_ON_DEFAULT,
} from "./constants.js";
import { errorMessage } from "./error.js";
import { logVerbose } from "./util.js";
import { CancellationOptions, toSignal } from "./cancellation.js";
import { resolveHttpsProxyAgent } from "./proxy.js";
import { host } from "./host.js";
import crossFetch from "cross-fetch";
import { prettyDuration, prettyStrings } from "./pretty.js";
import type { FetchOptions, RetryOptions } from "./types.js";
import { genaiscriptDebug } from "./debug.js";
import { deleteUndefinedValues } from "./cleaners.js";

const dbg = genaiscriptDebug("fetch");
const dbgr = dbg.extend("retry");

/**
 * Parses the retry-after header value.
 *
 * @param retryAfterHeader - The retry-after header value
 * @returns The number of seconds to wait, or null if parsing failed
 */
export function parseRetryAfter(retryAfterHeader: string): number | null {
  if (!retryAfterHeader) return null;

  const trimmed = retryAfterHeader.trim();
  dbgr(`parsing retry-after header: ${trimmed}`);

  // Try to parse as seconds (integer) first - must be a valid non-negative integer
  const seconds = parseInt(trimmed, 10);
  if (!isNaN(seconds) && seconds >= 0 && trimmed === seconds.toString()) {
    return seconds;
  }

  // Try to parse as HTTP date only if it's not a pure number
  if (!/^-?\d+$/.test(trimmed)) {
    try {
      const date = new Date(trimmed);
      if (!isNaN(date.getTime())) {
        const now = new Date();
        const delayMs = date.getTime() - now.getTime();
        const delaySeconds = Math.max(0, Math.ceil(delayMs / 1000));
        return delaySeconds;
      }
    } catch (e) {
      dbgr(`failed to parse retry-after header as date: %s`, errorMessage(e));
    }
  }

  dbgr(`failed to parse retry-after header: ${retryAfterHeader}`);
  return null;
}

function parseRetryAfterHeader(response: Response) {
  const retryAfterHeader =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    response.headers.get?.("retry-after") || (response.headers as any)["retry-after"];
  if (retryAfterHeader) {
    const retryAfterSeconds = parseRetryAfter(retryAfterHeader);
    if (retryAfterSeconds !== null) {
      const retryAfter = retryAfterSeconds * 1000; // Convert to milliseconds
      dbgr(`retry-after: %s`, prettyDuration(retryAfter));
      return retryAfter;
    }
  }
  return undefined;
}

export type FetchType = (
  input: string | URL | globalThis.Request,
  options?: FetchOptions & TraceOptions,
) => Promise<Response>;

/**
 * Creates a fetch function with retry logic.
 *
 * Wraps `crossFetch` with retry capabilities based on the provided options.
 * Configures the number of retries, delay between retries, HTTP status codes to retry on,
 * and supports cancellation and proxy configuration.
 *
 * @param options - Configuration for retries, delays, HTTP status codes, cancellation token, and tracing.
 *   - retryOn: HTTP status codes to retry on.
 *   - retries: Number of retry attempts.
 *   - retryDelay: Initial delay between retries.
 *   - maxDelay: Maximum delay between retries.
 *   - cancellationToken: Token to cancel the fetch.
 *   - trace: Trace options for logging.
 * @returns A fetch function with retry and cancellation support.
 */
export async function createFetch(
  options?: TraceOptions & CancellationOptions & RetryOptions,
): Promise<FetchType> {
  options = options || {};
  const {
    retries = FETCH_RETRY_DEFAULT,
    retryOn = FETCH_RETRY_ON_DEFAULT,
    trace,
    retryDelay = FETCH_RETRY_DEFAULT_DEFAULT,
    maxDelay = FETCH_RETRY_MAX_DELAY_DEFAULT,
    maxRetryAfter = FETCH_RETRY_MAX_RETRY_AFTER_DEFAULT,
    cancellationToken,
  } = options;

  dbg(`create fetch`);
  // We create a proxy based on Node.js environment variables.
  const agent = await resolveHttpsProxyAgent();

  const signal = toSignal(cancellationToken);
  // We enrich crossFetch with the proxy.
  const crossFetchWithProxy: typeof fetch = (url, options) => {
    const requestInit = deleteUndefinedValues({ signal, agent, ...(options || {}) });
    dbg(`%s %s`, options?.method || "GET", url);
    return crossFetch(url, requestInit);
  };

  // Return the default fetch if no retry status codes are specified
  if (!retryOn?.length) {
    dbgr("no retry logic applied, using crossFetchWithProxy directly");
    return crossFetchWithProxy;
  }

  // Create a fetch function with retry logic
  dbgr(
    `retries: %d, retry on: %o, retry delay: %d, max delay: %d, max retry after: %d`,
    retries,
    retryOn,
    retryDelay,
    maxDelay,
    maxRetryAfter,
  );
  const fetchRetry = wrapFetch(crossFetchWithProxy, {
    retries,
    retryOn: (attempt, error, response) => {
      const code: string = (error as { code?: string })?.code as string;

      if (response.ok) {
        dbgr("status %d is success, not retrying", response.status);
        return false;
      }

      dbgr(`retry #%d, %d`, attempt, response.status);
      if (
        code === "ECONNRESET" ||
        code === "ENOTFOUND" ||
        cancellationToken?.isCancellationRequested
      ) {
        dbgr("fatal error or cancellation");
        // Return undefined for fatal errors or cancellations to stop retries
        return undefined;
      }

      const status = response.status;
      if (retryOn?.length && !retryOn.includes(status)) {
        dbgr(`status %d not in retryOn %o, not retrying`, status, retryOn);
        return false;
      }
      const retryAfter = parseRetryAfterHeader(response);
      if (!isNaN(maxRetryAfter) && retryAfter > maxRetryAfter) {
        dbgr(
          `retry-after %s exceeds max-retry-after %s, give up`,
          prettyDuration(retryAfter),
          prettyDuration(maxRetryAfter),
        );
        return false;
      }
      return true;
    },
    retryDelay: (attempt, error, response) => {
      // Check for retry-after header and respect its value
      let delay: number;
      const retryAfter = parseRetryAfterHeader(response);

      if (retryAfter) {
        delay = Math.min(maxDelay, retryAfter); // Convert to milliseconds
      } else {
        // Fallback to exponential backoff if retry-after parsing failed
        delay =
          Math.min(maxDelay, Math.pow(FETCH_RETRY_GROWTH_FACTOR, attempt) * retryDelay) *
          (1 + Math.random() / 20);
        dbgr(`using exponential backoff: %d`, delay);
      }
      const msg = prettyStrings(
        `retry #${attempt + 1} in ${prettyDuration(delay)}`,
        `retry after: ${prettyDuration(retryAfter)}`,
        `max delay: ${prettyDuration(maxDelay)}`,
        `retry delay: ${prettyDuration(retryDelay)}`,
        errorMessage(error),
        statusToMessage(response),
      );
      logVerbose(msg);
      trace?.resultItem(false, msg);
      return delay;
    },
  });
  return fetchRetry;
}

/**
 * Executes an HTTP(S) request with optional retry logic.
 *
 * Wraps the input request with retry capabilities and additional configurations.
 * Leverages `createFetch` to handle retry conditions and builds a final fetch function.
 *
 * @param input - The input to the fetch request. Can be a string URL, URL object, or Request object.
 * @param options - Configuration options for the fetch operation.
 *   - retryOn: Array of HTTP status codes to retry on.
 *   - retries: Number of retry attempts.
 *   - retryDelay: Initial delay between retries in milliseconds.
 *   - maxDelay: Maximum allowable delay between retries in milliseconds.
 *   - trace: Trace options for logging the fetch operation.
 *   - ...rest: Additional options passed to the fetch request.
 * @returns A Promise resolving with the HTTP Response.
 */
export async function fetch(
  input: string | URL | globalThis.Request,
  options?: FetchOptions & TraceOptions,
): Promise<Response> {
  const { retryOn, retries, retryDelay, maxDelay, trace, ...rest } = options || {};
  const f = await createFetch({
    retryOn,
    retries,
    retryDelay,
    maxDelay,
    trace,
  });
  return f(input, rest);
}

/**
 * Converts the HTTP response status and status text into a list of strings.
 *
 * Extracts the status and status text from the response object for logging and debugging.
 *
 * @param res - The HTTP response object. Includes optional status and statusText fields.
 * @returns A list of strings containing the status and status text if provided.
 */
export function statusToMessage(res?: { status?: number; statusText?: string }) {
  const { status, statusText } = res || {};
  return prettyStrings(typeof status === "number" ? status + "" : undefined, statusText);
}

export async function tryReadText(res: Response, defaultValue?: string) {
  try {
    const text = await res.text();
    return text;
  } catch (e) {
    dbg(e);
    return defaultValue;
  }
}

export async function* iterateBody(
  r: Response,
  options?: CancellationOptions,
): AsyncGenerator<string> {
  const { cancellationToken } = options || {};
  const decoder = host.createUTF8Decoder(); // UTF-8 decoder for processing data
  if (r.body.getReader) {
    const reader = r.body.getReader();
    while (!cancellationToken?.isCancellationRequested) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      const text = decoder.decode(value, { stream: true });
      yield text;
    }
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for await (const value of r.body as any) {
      if (cancellationToken?.isCancellationRequested) {
        break;
      }
      const text = decoder.decode(value, { stream: true });
      yield text;
    }
  }
}
