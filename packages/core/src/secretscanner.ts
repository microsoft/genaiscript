import { genaiscriptDebug } from "./debug"
import { runtimeHost } from "./host"
import { TraceOptions } from "./trace"
import { logWarn } from "./util"
const dbg = genaiscriptDebug("secrets")

const cachedSecretScanners: Record<string, RegExp> = {}

/**
 * Redacts secrets in all string properties of the provided object.
 *
 * Iterates through each entry in the object and replaces detected secrets in string values with "<secret/>".
 * Non-string values are left unchanged.
 *
 * @param o The input object whose string properties may contain secrets to redact.
 * @returns A new object with string values redacted according to configured secret patterns; non-string values are preserved.
 */
export function redactSecretValues(o: Record<string, string>) {
    if (!o || typeof o !== "object") return o
    return Object.fromEntries(
        Object.entries(o).map(([k, v]) => {
            if (typeof v !== "string") return [k, v] // skip non-string values
            const { text, found } = redactSecrets(v)
            return [k, text]
        })
    )
}

/**
 * Redacts secrets from the provided text by replacing matches of configured secret patterns with `<secret/>`.
 *
 * @param text - The input text to be scanned for secrets.
 * @param options - Additional options for tracing and configuration:
 *   - trace: An optional trace object to log detected secrets and warnings.
 *
 * @returns An object containing:
 *   - text: The redacted text with secrets replaced by `<secret/>`.
 *   - found: A record where keys are secret names and values are counts of occurrences detected.
 */
export function redactSecrets(text: string, options?: TraceOptions) {
    const { trace } = options ?? {}
    const { secretPatterns = {} } = runtimeHost.config
    const found: Record<string, number> = {}
    const res = Object.entries(secretPatterns).reduce(
        (acc, [name, pattern]) => {
            if (!pattern) return acc // null, undefined, or empty string
            const regex: RegExp =
                cachedSecretScanners[pattern] ??
                (cachedSecretScanners[pattern] = new RegExp(pattern, "g"))
            return acc.replace(regex, () => {
                found[name] = (found[name] ?? 0) + 1
                return `<secret/>`
            })
        },
        text
    )

    if (Object.keys(found).length > 0 && trace) {
        const msg = `detected secrets: ${Object.entries(found)
            .map(([k, v]) => `${k} (${v})`)
            .join(", ")}`
        dbg(msg)
        logWarn(msg)
        trace.warn(msg)
    }

    return {
        text: res,
        found,
    }
}
