import { workerData, parentPort } from "node:worker_threads"
import { runScriptInternal } from "./run"
import { NodeHost } from "./nodehost"

export async function worker() {
    const { type, ...data } = workerData as {
        type: string
    }
    await NodeHost.install(undefined) // Install NodeHost with environment options
    switch (type) {
        case "run": {
            const { scriptId, files, options } = data as {
                scriptId: string
                files: string[]
                options: object
            }
            const { result } = await runScriptInternal(scriptId, files, options)
            parentPort.postMessage(result)
            break
        }
    }
}
