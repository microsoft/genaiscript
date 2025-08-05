// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
export let stdout = process.stdout;
export const stderr = process.stderr;
/**
 * Overrides the standard output stream with the standard error stream.
 *
 * No parameters are required for this function.
 * After execution, any output written to the standard output stream will
 * instead be redirected to the standard error stream.
 */
export function overrideStdoutWithStdErr() {
    stdout = stderr;
}
//# sourceMappingURL=stdio.js.map