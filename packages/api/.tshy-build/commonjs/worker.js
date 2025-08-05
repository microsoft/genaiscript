"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.worker = worker;
const node_worker_threads_1 = require("node:worker_threads");
const es_toolkit_1 = require("es-toolkit");
const runtime_1 = require("@genaiscript/runtime");
const core_1 = require("@genaiscript/core");
const run_js_1 = require("./run.js");
const dbg = (0, core_1.genaiscriptDebug)("worker");
/**
 * Handles worker thread execution based on the provided data type.
 *
 * Parameters:
 *     - type: Specifies the type of operation to execute. For now, supports "run".
 *     - scriptId: Identifier of the script to be executed (provided when type is "run").
 *     - files: List of file paths required for script execution (provided when type is "run").
 *     - options: Additional configuration options for script execution (provided when type is "run").
 *
 * Notes:
 *     - Redirects stdout to stderr.
 *     - Installs NodeHost with environment options.
 *     - Handles resource change events and communicates them to the parent thread.
 */
async function worker() {
    (0, core_1.overrideStdoutWithStdErr)();
    (0, core_1.installGlobals)();
    const { type, ...data } = node_worker_threads_1.workerData;
    dbg(`worker data: %O`, data);
    await runtime_1.NodeHost.install(undefined, undefined); // Install NodeHost with environment options
    const runtimeHost = (0, core_1.resolveRuntimeHost)();
    runtimeHost.resources.addEventListener(core_1.RESOURCE_CHANGE, (ev) => {
        const cev = ev;
        const { reference, content } = cev.detail;
        node_worker_threads_1.parentPort.postMessage({
            type: core_1.RESOURCE_CHANGE,
            reference,
            content,
        });
    });
    switch (type) {
        case "run": {
            const { scriptId, files, options } = data;
            if (options.parentLanguageModel) {
                dbg(`using parent language model`);
                runtimeHost.clientLanguageModel = (0, core_1.createWorkerLanguageModel)();
            }
            const { result } = await (0, run_js_1.runScriptInternal)(scriptId, files, options);
            await (0, es_toolkit_1.delay)(0); // flush streams
            node_worker_threads_1.parentPort.postMessage({ type: "run", result });
            break;
        }
    }
}
worker();
//# sourceMappingURL=worker.js.map