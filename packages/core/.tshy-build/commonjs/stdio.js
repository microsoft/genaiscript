"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.stderr = exports.stdout = void 0;
exports.overrideStdoutWithStdErr = overrideStdoutWithStdErr;
exports.stdout = process.stdout;
exports.stderr = process.stderr;
/**
 * Overrides the standard output stream with the standard error stream.
 *
 * No parameters are required for this function.
 * After execution, any output written to the standard output stream will
 * instead be redirected to the standard error stream.
 */
function overrideStdoutWithStdErr() {
    exports.stdout = exports.stderr;
}
//# sourceMappingURL=stdio.js.map