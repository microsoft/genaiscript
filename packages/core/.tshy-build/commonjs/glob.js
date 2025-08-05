"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.isGlobMatch = isGlobMatch;
const minimatch_1 = require("minimatch");
const cleaners_js_1 = require("./cleaners.js");
/**
 * Checks if a given filename matches any of the provided glob patterns.
 *
 * @param filename - The name of the file to test against the patterns.
 * @param patterns - A single glob pattern or an array of glob patterns to match against.
 * @returns A boolean indicating if the filename matches any of the patterns.
 */
function isGlobMatch(filename, patterns, options) {
    // Convert patterns to an array and check if any pattern matches the filename
    return (0, cleaners_js_1.arrayify)(patterns).some((pattern) => {
        // Perform the match using minimatch with specific options
        const match = (0, minimatch_1.minimatch)(filename, pattern, {
            // Option to handle Windows paths correctly by preventing escape character issues
            windowsPathsNoEscape: true,
            ...(options || {}),
        });
        return match; // Return true if a match is found
    });
}
//# sourceMappingURL=glob.js.map