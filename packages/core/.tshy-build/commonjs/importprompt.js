"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.importFile = importFile;
exports.importPrompt = importPrompt;
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
const host_js_1 = require("./host.js");
const util_js_1 = require("./util.js");
const node_url_1 = require("node:url");
const performance_js_1 = require("./performance.js");
const pathUtils_js_1 = require("./pathUtils.js");
const api_1 = require("tsx/esm/api");
const debug_js_1 = require("./debug.js");
const error_js_1 = require("./error.js");
const node_path_1 = require("node:path");
const dbg = (0, debug_js_1.genaiscriptDebug)("tsx");
const dbgi = (0, debug_js_1.genaiscriptDebug)("tsx:import");
const { __filename } = typeof module !== "undefined" && module.filename
    ? (0, pathUtils_js_1.getModulePaths)(module)
    : // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        (0, pathUtils_js_1.getModulePaths)(import.meta);
/**
 * Dynamically imports a JavaScript module from a specified file.
 *
 * @param filename - The path of the file to be imported. Must be a valid string.
 * @param options - Optional parameters:
 *   - onImported: A callback executed after the module is imported. Receives the module as an argument.
 *   - logCb: A callback for logging messages.
 *   - trace: Optional tracing utility for debugging and error tracking.
 * @returns A promise that resolves to the value returned by the `onImported` callback, if provided.
 *
 * @throws An error if the `filename` is not provided or if the module import fails.
 */
async function importFile(filename, options) {
    const { trace, onImported } = options || {};
    if (!filename) {
        throw new Error("filename is required");
    }
    const runtimeHost = (0, host_js_1.resolveRuntimeHost)();
    let unregister = undefined;
    try {
        const modulePath = (0, node_url_1.pathToFileURL)((0, node_path_1.isAbsolute)(filename) ? filename : (0, node_path_1.join)(runtimeHost.projectFolder(), filename)).toString();
        const parentURL = (0, node_url_1.pathToFileURL)(__filename).toString();
        const onImport = (_file) => dbgi(`%s`, _file);
        dbg(`import %s, parent %s`, modulePath, parentURL);
        unregister = (0, api_1.register)({ onImport });
        const module = await (0, api_1.tsImport)(modulePath, {
            parentURL,
            // tsconfig: false,
            onImport,
        });
        const result = await onImported?.(module);
        unregister?.();
        return result;
    }
    catch (err) {
        dbg(`error %s`, (0, error_js_1.errorMessage)(err));
        unregister?.();
        (0, util_js_1.logError)(err);
        trace?.error(err);
        throw err;
    }
}
/**
 * Imports and executes the default export of a given file as a function.
 *
 * @param ctx0 - The prompt context to pass to the imported function.
 * @param r - The prompt script object containing the filename and system prompt information.
 * @param options - Optional configuration:
 *   - logCb: A callback for logging messages.
 *   - TraceOptions: Additional tracing options.
 *
 * @throws Error if the imported file is a system prompt and does not export a default function.
 * @returns A promise that resolves when the function execution is complete.
 */
async function importPrompt(ctx0, r, options) {
    (0, performance_js_1.mark)("prompt.import");
    const { filename } = r;
    dbg(`importing file: ${filename}`);
    return await importFile(filename, {
        ...(options || {}),
        onImported: async (module) => {
            const main = module.default;
            if (typeof main === "function") {
                dbg(`found default export as function, calling`);
                await main(ctx0);
            }
            else if (r.isSystem) {
                throw new Error("system prompt using esm JavaScript (mjs, mts) must have a default function.");
            }
        },
    });
}
//# sourceMappingURL=importprompt.js.map