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
    scriptId: string,
    files?: string[],
    options?: Partial<PromptScriptRunOptions> & {
        env?: Record<string, string>
    }
): Promise<{
    exitCode: number
    result?: GenerationResult
}> {
    const { env, ...rest } = options || {}
    const workerData = {
        type: "run",
        scriptId,
        files: files || [],
        options: rest,
    }

    const filename =
        typeof __filename === "undefined"
            ? // ignore esbuild warning
              join(dirname(fileURLToPath(import.meta.url)), "genaiscript.cjs")
            : __filename
    const worker = new Worker(filename, { workerData, name: options?.label })
    return new Promise((resolve, reject) => {
        worker.on("online", () => process.stderr.write(`worker: online\n`))
        worker.on("message", resolve)
        worker.on("error", reject)
    })
}
