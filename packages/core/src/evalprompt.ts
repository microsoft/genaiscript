import { host } from "./host"
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
    const keys = Object.keys(ctx)
    /*
    // use this code to refresh the codegen
    const signature = `const fn = async function (${keys.map((k) => `${k}: any`).join(", ")}) => any {
        await import(ff)
    }
    return await fn(${keys.map(k => `ctx.${k}`).join(", ")})`
    console.log(signature)
    */

    if (useFile) {
        if (!r.filename) throw new Error(`${r.id} script file not found`)
        const ff = host.path.resolve(r.filename)
        const fn = async function (
            script: any,
            system: any,
            env: any,
            path: any,
            parsers: any,
            retreival: any,
            fs: any,
            YAML: any,
            CSV: any,
            fence: any,
            def: any,
            defFunction: any,
            defFileMerge: any,
            defSchema: any,
            defImages: any,
            defData: any,
            writeText: any,
            runPrompt: any,
            fetchText: any,
            cancel: any,
            $: any,
            console: any
        ) {
            debugger
            await import(ff)
        }
        return await fn(
            ctx.script,
            ctx.system,
            ctx.env,
            ctx.path,
            ctx.parsers,
            ctx.retreival,
            ctx.fs,
            ctx.YAML,
            ctx.CSV,
            ctx.fence,
            ctx.def,
            ctx.defFunction,
            ctx.defFileMerge,
            ctx.defSchema,
            ctx.defImages,
            ctx.defData,
            ctx.writeText,
            ctx.runPrompt,
            ctx.fetchText,
            ctx.cancel,
            ctx.$,
            ctx.console
        )
    } else {
        const jsSource = r.jsSource
        const wrappedSource =
            "async (" +
            keys.join(", ") +
            ") => { 'use strict'; " +
            jsSource +
            "\n}"
        // in principle we could cache this function (but would have to do that based on hashed body or sth)
        // but probably little point
        const fn = (0, eval)(wrappedSource)
        return await fn(...Object.values(ctx))
    }
}
