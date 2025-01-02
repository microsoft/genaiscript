import { installGlobals } from "../../core/src/globals"
import { cli } from "./cli"
import { workerData } from "node:worker_threads"
import { worker } from "./worker"
import { run } from "./api"
import { PromptScriptRunOptions } from "../../core/src/server/messages"
import { GenerationResult } from "../../core/src/server/messages"

export { run, type PromptScriptRunOptions, type GenerationResult }

// if this file is not the entry point, skip cli
if (require.main === module) {
    // Initialize global settings or variables for the application
    // This might include setting up global error handlers or configurations
    installGlobals()
    if (workerData) {
        // Executes a worker
        worker()
    } else {
        // Execute the command-line interface logic
        // This function likely handles parsing input arguments and executing commands
        cli()
    }
}
