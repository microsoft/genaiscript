import { workerData, parentPort } from "node:worker_threads"
import { runScriptInternal } from "./run"
import { NodeHost } from "./nodehost"

export async function worker() {
    const { type, dotEnvPath, ...data } = workerData as {
        type: string
        dotEnvPath: string
    } & object
    await NodeHost.install(dotEnvPath) // Install NodeHost with environment options
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
