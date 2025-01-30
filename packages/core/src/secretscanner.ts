import { i } from "mathjs"
import { runtimeHost } from "./host"
import { TraceOptions } from "./trace"
import { kMaxLength } from "buffer"

const cachedSecretScanners: Record<string, RegExp> = {}

export function redactSecrets(text: string, options?: TraceOptions) {
    const { trace } = options ?? {}
    const { secretPatterns = {} } = runtimeHost.config
    let n = 0
    const found: Record<string, number> = {}
    const res = Object.entries(secretPatterns).reduce(
        (acc, [name, pattern]) => {
            const regex: RegExp =
                cachedSecretScanners[pattern] ??
                (cachedSecretScanners[pattern] = new RegExp(pattern, "g"))
            return acc.replace(regex, (m) => {
                found[name] = (found[name] ?? 0) + 1
                n++
                return `<secret type="${name}" />`
            })
        },
        text
    )

    if (Object.keys(found).length > 0 && trace) {
        trace.warn(
            `detected secrets (${n}):
            ${Object.entries(found)
                .map(([k, v]) => `${k}: ${v}`)
                .join(", ")}`
        )
    }

    return {
        text: res,
        found,
    }
}
