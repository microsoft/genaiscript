import { assert } from "console"
import { host } from "./host"
import { logError } from "./util"
import { TraceOptions } from "./trace"
import { pathToFileURL } from "url"

function resolveGlobal(): any {
    if (typeof window !== "undefined")
        return window // Browser environment
    else if (typeof self !== "undefined") return self
    else if (typeof global !== "undefined") return global // Node.js environment
    throw new Error("Could not find global")
}

export async function importPrompt(
    ctx0: PromptContext,
    r: PromptScript,
    options?: {
        logCb?: (msg: string) => void
    } & TraceOptions
) {
    const { filename } = r
    if (!filename) throw new Error("filename is required")
    const { trace } = options || {}

    const oldGlb: any = {}
    const glb: any = resolveGlobal()
    let unregister: () => void = undefined
    try {
        // override global context
        for (const field of Object.keys(ctx0)) {
            assert(
                field === "console" || !glb[field],
                `overriding global field ${field}`
            )
            oldGlb[field] = glb[field]
            glb[field] = (ctx0 as any)[field]
        }

        const modulePath = pathToFileURL(
            host.path.isAbsolute(filename)
                ? filename
                : host.path.join(host.projectFolder(), filename)
        ).toString()
        const parentURL =
            import.meta.url ??
            pathToFileURL(__filename ?? host.projectFolder()).toString()

        trace?.itemValue(`import`, `${modulePath}, parent: ${parentURL}`)
        const onImport = (file: string) => {
            trace?.itemValue("📦 import", file)
        }
        const { tsImport, register } = await import("tsx/esm/api")
        unregister = register({ onImport })
        const module = await tsImport(modulePath, {
            parentURL,
            //tsconfig: false,
            onImport,
        })
        const main = module.default
        if (typeof main === "function") await main(ctx0)
        unregister?.()
    } catch (err) {
        unregister?.()
        logError(err)
        trace?.error(err)
        throw err
    } finally {
        // restore global context
        for (const field of Object.keys(oldGlb)) {
            const v = oldGlb[field]
            if (v === undefined) delete glb[field]
            else glb[field] = oldGlb[field]
        }
    }
}
