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
export async function runScript(
    scriptId: string,
    files?: string[],
    options?: Partial<PromptScriptRunOptions>
): Promise<{
    exitCode: number
    result?: GenerationResult
}> {
    const { label } = options || {}
    const workerData = {
        type: "run",
        scriptId,
        files: files || [],
        options,
    }

    const filename =
        typeof __filename === "undefined"
            ? join(dirname(fileURLToPath(import.meta.url)), "genaiscript.cjs")
            : __filename
    const worker = new Worker(filename, { workerData, name: label })
    return new Promise((resolve, reject) => {
        worker.on("online", () => process.stderr.write(`worker: online\n`))
        worker.on("message", resolve)
        worker.on("error", reject)
    })
}
