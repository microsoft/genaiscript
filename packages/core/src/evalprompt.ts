import { consoleLogFormat } from "./logging"

export async function evalPrompt(
    ctx0: PromptContext,
    r: PromptTemplate,
    options?: {
        useFile?: boolean
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

    const jsSource = r.jsSource
    const wrappedSource =
        "async (" +
        Object.keys(ctx).join(", ") +
        ") => { 'use strict'; " +
        jsSource +
        "\n}"
    // in principle we could cache this function (but would have to do that based on hashed body or sth)
    // but probably little point
    const fn = (0, eval)(wrappedSource)
    return await fn(...Object.values(ctx))
}
