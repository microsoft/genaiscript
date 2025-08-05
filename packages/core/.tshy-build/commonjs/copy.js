"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.copyPrompt = copyPrompt;
// This file defines functions related to copying and managing prompt scripts,
// including constructing file paths and handling copy operations,
// with optional forking functionality.
const constants_js_1 = require("./constants.js"); // Import constants for file extensions and source directory
const fs_js_1 = require("./fs.js"); // Import file system utilities
const host_js_1 = require("./host.js");
/**
 * Constructs the path to a prompt file.
 * If `id` is null, returns the base prompt directory path.
 * Otherwise, appends the `id` with a specific file extension to the path.
 *
 * @param id - Identifier for the prompt script
 * @returns The file path as a string
 */
function promptPath(id, options) {
    const { javascript } = options || {};
    const runtimeHost = (0, host_js_1.resolveRuntimeHost)();
    const prompts = runtimeHost.resolvePath(runtimeHost.projectFolder(), constants_js_1.GENAI_SRC); // Resolve base prompt directory
    if (id === null)
        return prompts; // Return base path if id is not provided
    const ext = javascript ? constants_js_1.GENAI_MJS_EXT : constants_js_1.GENAI_MTS_EXT;
    return runtimeHost.resolvePath(prompts, id + ext); // Construct full path if id is provided
}
/**
 * Copies a prompt script to a new location.
 * Optionally forks the script, ensuring the new filename is unique if needed.
 *
 * @param t - The prompt script object containing the source code.
 * @param options - Configuration options for the copy operation.
 * @param options.fork - Whether to fork the script by appending a unique suffix.
 * @param options.name - Optional new name for the copied script.
 * @param options.javascript - Whether to use the JavaScript file extension.
 * @returns The file path of the copied script.
 * @throws If the file already exists in the target location.
 */
async function copyPrompt(t, options) {
    // Ensure the prompt directory exists
    const runtimeHost = (0, host_js_1.resolveRuntimeHost)();
    await runtimeHost.createDirectory(promptPath(null));
    // Determine the name for the new prompt file
    const n = options?.name || t.id; // Use provided name or default to script id
    let fn = promptPath(n);
    // Handle forking logic by appending a suffix if needed
    if (options.fork && (await (0, fs_js_1.fileExists)(fn))) {
        let suff = 2;
        for (;;) {
            fn = promptPath(n + "_" + suff, options); // Construct new name with suffix
            if (await (0, fs_js_1.fileExists)(fn)) {
                // Check if file already exists
                suff++;
                continue; // Increment suffix and retry if file exists
            }
            break; // Exit loop if file does not exist
        }
    }
    // Check if the file already exists, throw error if it does
    if (await (0, fs_js_1.fileExists)(fn))
        throw new Error(`file ${fn} already exists`);
    // Write the prompt script to the determined path
    await (0, fs_js_1.writeText)(fn, t.jsSource);
    return fn; // Return the path of the copied script
}
//# sourceMappingURL=copy.js.map