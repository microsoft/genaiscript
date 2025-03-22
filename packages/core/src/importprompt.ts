import { host } from "./host"
import { logError } from "./util"
import { TraceOptions } from "./trace"
import { pathToFileURL } from "url"
import { mark } from "./performance"

export async function importFile<T = void>(
    filename: string,
    options?: {
        onImported?: (module: any) => Awaitable<T>
        logCb?: (msg: string) => void
    } & TraceOptions
): Promise<T> {
    const { trace, onImported } = options || {}
    if (!filename) throw new Error("filename is required")

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
        const result = await onImported?.(module)
        unregister?.()

        return result
    } catch (err) {
        unregister?.()
        logError(err)
        trace?.error(err)
        throw err
    }
}

export async function importPrompt(
    ctx0: PromptContext,
    r: PromptScript,
    options?: {
        logCb?: (msg: string) => void
    } & TraceOptions
) {
    mark("prompt.import")
    const { filename } = r
    return await importFile(filename, {
        ...(options || {}),
        onImported: async (module) => {
            const main = module.default
            if (typeof main === "function") await main(ctx0)
            else if (r.isSystem)
                throw new Error(
                    "system prompt using esm JavaScript (mjs, mts) must have a default function."
                )
        },
    })
}
