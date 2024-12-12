import type { GenerationResult } from "../../core/src/generation"
import type { PromptScriptRunOptions } from "../../core/src/server/messages"
import { Worker } from "node:worker_threads"
import { fileURLToPath } from "url"
import { dirname, join } from "node:path"

/**
 * Runs a GenAIScript script with the given files and options.
 * This function acts similarly to the `run` command in the CLI.
 * @param scriptId script identifier or full file path
 * @param files list of file paths to run the script on, leave empty if not needed
 * @param options
 * @returns
 */
export async function run(
    /**
     * The script identifier or full file path.
     */
    scriptId: string,
    /**
     * List of file paths to run the script on, leave empty if not needed.
     */
    files?: string | string[],
    /**
     * GenAIScript generation options.
     */
    options?: Partial<PromptScriptRunOptions> & {
        /**
         * Environment variables to use for the operation.
         */
        env?: Record<string, string>
        /**
         * The signal to use for aborting the operation. Terminates the worker thread.
         */
        signal?: AbortSignal
    }
): Promise<{
    exitCode: number
    result?: GenerationResult
}> {
    if (!scriptId) throw new Error("scriptId is required")

    const { env, signal, ...rest } = options || {}
    const workerData = {
        type: "run",
        scriptId,
        files: files || [],
        options: rest,
    }
    if (typeof files === "string") files = [files]
    const filename =
        typeof __filename === "undefined"
            ? join(dirname(fileURLToPath(import.meta.url)), "genaiscript.cjs") // ignore esbuild warning
            : __filename
    let worker = new Worker(filename, { workerData, name: options?.label })
    return new Promise((resolve, reject) => {
        const abort = () => {
            if (worker) {
                reject(new Error("aborted")) // fail early
                worker.terminate() // don't wait for the worker to finish
            }
        }
        signal?.addEventListener("abort", abort)
        worker.on("message", (res) => {
            signal?.removeEventListener("abort", abort)
            resolve(res)
        })
        worker.on("error", () => {
            signal?.removeEventListener("abort", abort)
            reject()
        })
    })
}
