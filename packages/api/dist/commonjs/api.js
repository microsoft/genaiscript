"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = run;
const node_worker_threads_1 = require("node:worker_threads");
const core_1 = require("@genaiscript/core");
const debug_1 = __importDefault(require("debug"));
const node_path_1 = require("node:path");
const dbg = (0, debug_1.default)("genaiscript:api");
const { __dirname } = typeof module !== "undefined" && module.filename
    ? (0, core_1.getModulePaths)(module)
    : // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        (0, core_1.getModulePaths)(import.meta);
/**
 * Runs a GenAIScript script with the given files and options.
 * This function acts similarly to the `run` command in the CLI.
 * @param scriptId The script identifier or full file path. This parameter is required.
 * @param files List of file paths to run the script on, leave empty if not needed.
 * @param options GenAIScript generation options, including optional environment variables, an abort signal, and additional options. The options may include a label for the worker thread.
 *   - envVars: Environment variables to use for the operation.
 *   - signal: The signal to use for aborting the operation. Terminates the worker thread.
 * @returns A promise that resolves with the generation result or rejects if an error occurs.
 */
async function run(
/**
 * The script identifier or full file path.
 */
scriptId, 
/**
 * List of file paths to run the script on, leave empty if not needed.
 */
files, 
/**
 * GenAIScript generation options.
 */
options) {
    if (!scriptId)
        throw new Error("scriptId is required");
    dbg(`run ${scriptId}`);
    // eslint-disable-next-line no-param-reassign
    if (typeof files === "string")
        files = [files];
    const { signal, onMessage, ...rest } = options || {};
    const workerData = {
        type: "run",
        scriptId,
        files: files || [],
        options: rest,
    };
    dbg(`__dirname: %s`, __dirname);
    const sidebyside = await (0, core_1.tryStat)((0, node_path_1.join)(__dirname, "worker.js"));
    const workerJs = sidebyside
        ? (0, node_path_1.join)(__dirname, "worker.js")
        : (0, node_path_1.join)((0, node_path_1.dirname)(__dirname), "dist", "esm", "worker.js");
    dbg(`start ${workerJs}`);
    const worker = new node_worker_threads_1.Worker(workerJs, { workerData, name: options?.label });
    return new Promise((resolve, reject) => {
        const abort = () => {
            if (worker) {
                dbg(`abort`);
                reject(new Error("aborted")); // fail early
                worker.terminate(); // don't wait for the worker to finish
            }
        };
        signal?.addEventListener("abort", abort);
        worker.on("message", async (res) => {
            const type = res?.type;
            dbg(type);
            if (type === "run") {
                signal?.removeEventListener("abort", abort);
                resolve(res.result);
            }
            else if (onMessage) {
                await onMessage(res, (data) => {
                    dbg(`postMessage %O`, data);
                    worker.postMessage(data);
                });
            }
            else {
                dbg(`unknown message type ${type}`);
            }
        });
        worker.on("error", (reason) => {
            dbg(`error ${reason}`);
            signal?.removeEventListener("abort", abort);
            reject(reason);
        });
    });
}
//# sourceMappingURL=api.js.map