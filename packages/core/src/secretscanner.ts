import { runtimeHost } from "./host"
import { TraceOptions } from "./trace"
import { logWarn } from "./util"

const cachedSecretScanners: Record<string, RegExp> = {}

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
        logWarn(msg)
        trace.warn(msg)
    }

    return {
        text: res,
        found,
    }
}
