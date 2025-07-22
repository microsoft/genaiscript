// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { parentPort } from "node:worker_threads";
import { generateId } from "./id.js";
import { genaiscriptDebug } from "./debug.js";
const dbg = genaiscriptDebug("worker:lm");
export function createWorkerLanguageModel() {
    if (!parentPort)
        throw new Error("This function must be called in a worker thread");
    return Object.freeze({
        id: "worker",
        completer: async (request, connection, completerOptions, trace) => {
            const id = generateId();
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
                parentPort.once("message", handler);
                parentPort.postMessage({
                    type: "chatCompletion",
                    id,
                    request,
                });
            });
        },
    });
}
//# sourceMappingURL=workerlm.js.map