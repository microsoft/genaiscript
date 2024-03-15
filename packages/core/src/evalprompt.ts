import { host } from "./host"
import MagicString from "magic-string"
import { consoleLogFormat } from "./logging"

export async function evalPrompt(
    ctx0: PromptContext,
    r: PromptTemplate,
    options?: {
        logCb?: (msg: string) => void
    }
) {
    const { logCb } = options || {}
    const log = (...args: any[]) => {
        const line = consoleLogFormat(...args)
        logCb?.(line)
    }
    const ctx = Object.freeze<
        PromptContext & { console: Partial<typeof console> }
    >({
        ...ctx0,
        console: {
            log: log,
            warn: log,
            debug: log,
            error: log,
            info: log,
            trace: log,
        },
    })
    const keys = Object.keys(ctx)
    const prefix = "async (" + keys.join(",") + ") => { 'use strict';"
    const suffix = "}"

    const jsSource = r.jsSource
    const src = [prefix, jsSource, suffix]
    // source map
    if (r.filename) {
        const s = new MagicString(jsSource)
        s.prepend(prefix)
        s.append(suffix)
        const source = host.path.resolve(r.filename)
        const map = s.generateMap({
            source,
            includeContent: true,
            file: source + ".map",
        })
        src.push(`//# sourceMappingURL=${map.toUrl()}`)
        src.push(`//# sourceURL=${source}`)
    }
    const fsrc = src.join("\n")

    // in principle we could cache this function (but would have to do that based on hashed body or sth)
    // but probably little point
    const fn = (0, eval)(fsrc)
    return await fn(...Object.values(ctx))
}
