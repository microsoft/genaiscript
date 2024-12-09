import { installGlobals } from "../../core/src/globals"
import { cli } from "./cli"
import { workerData } from "node:worker_threads"
import { worker } from "./worker"
import { runScript } from "./api"

export { runScript }

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
