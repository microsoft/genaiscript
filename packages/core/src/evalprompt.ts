import { consoleLogFormat } from "./logging"

export async function evalPrompt(
    ctx0: PromptContext,
    r: PromptTemplate,
    options?: {
        useFile?: boolean
        logCb?: (msg: string) => void
    }
) {
    const { logCb, useFile } = options || {}
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

    let fn: (...args: any[]) => any
    if (useFile) {
        if (!r.filename) throw new Error(`${r.id} script file not found`)

        fn = async function (...args: any[]) {
            await import(r.filename)
        }
    } else {
        const jsSource = r.jsSource
        const wrappedSource =
            "async (" +
            Object.keys(ctx).join(", ") +
            ") => { 'use strict'; " +
            jsSource +
            "\n}"
        // in principle we could cache this function (but would have to do that based on hashed body or sth)
        // but probably little point
        fn = (0, eval)(wrappedSource)
    }

    return await fn(...Object.values(ctx))
}
