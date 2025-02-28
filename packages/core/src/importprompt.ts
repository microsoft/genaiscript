import { host } from "./host"
import { logError } from "./util"
import { TraceOptions } from "./trace"
import { pathToFileURL } from "url"

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

    let unregister: () => void = undefined
    try {
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
        else if (r.isSystem)
            throw new Error(
                "system prompt using esm JavaScript (mjs, mts) must have a default function."
            )
        unregister?.()
    } catch (err) {
        unregister?.()
        logError(err)
        trace?.error(err)
        throw err
    }
}
