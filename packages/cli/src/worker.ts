import { workerData, parentPort } from "node:worker_threads"
import { runScriptInternal } from "./run"
import { NodeHost } from "./nodehost"
import { delay } from "es-toolkit"
import { overrideStdoutWithStdErr } from "../../core/src/stdio"

export async function worker() {
    overrideStdoutWithStdErr()
    const { type, ...data } = workerData as {
        type: string
    }
    await NodeHost.install(undefined) // Install NodeHost with environment options
    if (process.platform === "win32") {
        // https://github.com/Azure/azure-sdk-for-js/issues/32374
        process.env.SystemRoot = process.env.SYSTEMROOT
    }

    switch (type) {
        case "run": {
            const { scriptId, files, options } = data as {
                scriptId: string
                files: string[]
                options: object
            }
            const { result } = await runScriptInternal(scriptId, files, options)
            await delay(0) // flush streams
            parentPort.postMessage(result)
            break
        }
    }
}
