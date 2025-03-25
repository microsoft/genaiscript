import debug from "debug"
const dbg = debug("genaiscript:importprompt")

import { host } from "./host"
import { logError } from "./util"
import { TraceOptions } from "./trace"
import { pathToFileURL } from "url"
import { mark } from "./performance"

/**
 * Dynamically imports a module given its filename.
 * 
 * The function resolves the module path, imports the module, and optionally executes
 * a callback upon successful import. It supports tracing and logging through provided options.
 * 
 * @param filename - The path to the module file to import.
 * @param options - Options for the import process.
 * @param options.onImported - Callback function invoked with the imported module.
 * @param options.logCb - Callback function for logging messages.
 * @throws Error if the filename is not provided or if the import fails.
 * 
 * @returns A promise that resolves with the result of the onImported callback, if provided.
 */
export async function importFile<T = void>(
    filename: string,
    options?: {
        onImported?: (module: any) => Awaitable<T>
        logCb?: (msg: string) => void
    } & TraceOptions
): Promise<T> {
    const { trace, onImported } = options || {}
    if (!filename) {
        throw new Error("filename is required")
    }

    let unregister: () => void = undefined
    try {
        dbg(`resolving module path for filename: ${filename}`)
        const modulePath = pathToFileURL(
            host.path.isAbsolute(filename)
                ? filename
                : host.path.join(host.projectFolder(), filename)
        ).toString()
        const parentURL =
            import.meta.url ??
            pathToFileURL(__filename ?? host.projectFolder()).toString()

        dbg(`importing module from path: ${modulePath}`)
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
        dbg("module imported failed")
        unregister?.()
        logError(err)
        trace?.error(err)
        throw err
    }
}

/**
 * Imports a prompt file and executes its default export if it is a function.
 * 
 * The function marks the start of the import process, logs the filename,
 * and utilizes the `importFile` function to handle the import.
 * If the imported module has a default export that is a function, it is called
 * with the provided context. An error is thrown if the imported module
 * is a system prompt and does not export a default function.
 * 
 * @param ctx0 - The context for the prompt execution.
 * @param r - The prompt script containing the filename to import.
 * @param options - Optional parameters for logging and tracing.
 * 
 * @returns A promise that resolves when the default export function is executed.
 */
export async function importPrompt(
    ctx0: PromptContext,
    r: PromptScript,
    options?: {
        logCb?: (msg: string) => void
    } & TraceOptions
) {
    mark("prompt.import")
    const { filename } = r
    dbg(`importing file: ${filename}`)
    return await importFile(filename, {
        ...(options || {}),
        onImported: async (module) => {
            const main = module.default
            if (typeof main === "function") {
                dbg(`found default export as function, calling`)
                await main(ctx0)
            } else if (r.isSystem) {
                throw new Error(
                    "system prompt using esm JavaScript (mjs, mts) must have a default function."
                )
            }
        },
    })
}
