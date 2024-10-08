import { host } from "./host"
import { logError, logVerbose } from "./util"
import { TraceOptions } from "./trace"
import { pathToFileURL } from "url"
import { resolveGlobal } from "./globals"

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

    const leakables = [
        "host",
        "workspace",
        "path",
        "parsers",
        "env",
        "retrieval",
        "runPrompt",
        "prompt",
    ]

    const oldGlb: any = {}
    const glb: any = resolveGlobal()
    let unregister: () => void = undefined
    try {
        // override global context
        for (const field of Object.keys(ctx0)) {
            //logVerbose(
            //    field === "console" || leakables.includes(field) || !glb[field],
            //    `overriding global field ${field}`
            //)
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

        const onImport = (file: string) => {
            // trace?.itemValue("📦 import", fileURLToPath(file))
        }
        onImport(modulePath)
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
            if (leakables.includes(field)) continue
            const v = oldGlb[field]
            if (v === undefined) delete glb[field]
            else glb[field] = oldGlb[field]
        }
    }
}
