import { RequestError } from "./chat"

export function throwError(e: string | Error, cancel?: boolean) {
    if (typeof e === "string") e = new Error(e)
    if (cancel)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (e as any).__cancel = true
    throw e
}

export function isCancelError(e: Error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return !!(e as any)?.__cancel || e.name === "AbortError"
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
