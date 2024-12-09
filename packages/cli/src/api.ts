import { GenerationResult } from "../../core/src/generation"
import { PromptScriptRunOptions } from "../../core/src/server/messages"
import { Worker } from "node:worker_threads"
import { logVerbose } from "../../core/src/util"

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
    const worker = new Worker(__filename, { workerData, name: label })
    return new Promise((resolve, reject) => {
        worker.on("online", () => logVerbose(`worker: online`))
        worker.on("message", resolve)
        worker.on("error", reject)
    })
}
