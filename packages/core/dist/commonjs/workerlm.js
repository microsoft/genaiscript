"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWorkerLanguageModel = createWorkerLanguageModel;
const node_worker_threads_1 = require("node:worker_threads");
const id_js_1 = require("./id.js");
const debug_js_1 = require("./debug.js");
const dbg = (0, debug_js_1.genaiscriptDebug)("worker:lm");
function createWorkerLanguageModel() {
    if (!node_worker_threads_1.parentPort)
        throw new Error("This function must be called in a worker thread");
    return Object.freeze({
        id: "worker",
        completer: async (request, connection, completerOptions, trace) => {
            const id = (0, id_js_1.generateId)();
            dbg(`request %s`, id);
            const { partialCb, inner } = completerOptions || {};
            return new Promise((resolve, reject) => {
                // eslint-disable-next-line n/no-unsupported-features/node-builtins
                const handler = (detail) => {
                    dbg(`message: %O`, detail);
                    if (detail?.type !== "chatCompletion" || detail?.id !== id) {
                        return;
                    }
                    dbg(`response %s`, id);
                    const { response: result, error } = detail;
                    if (error) {
                        reject(error.message);
                    }
                    else if (!result) {
                        reject("No result returned from worker");
                    }
                    else {
                        partialCb?.({
                            responseSoFar: result.text,
                            responseChunk: result.text,
                            tokensSoFar: result.usage?.total_tokens,
                            inner,
                        });
                        resolve(result);
                    }
                };
                node_worker_threads_1.parentPort.once("message", handler);
                node_worker_threads_1.parentPort.postMessage({
                    type: "chatCompletion",
                    id,
                    request,
                });
            });
        },
    });
}
//# sourceMappingURL=workerlm.js.map