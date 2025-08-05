"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.isQuiet = void 0;
exports.setQuiet = setQuiet;
// Boolean indicating if debug messages should be suppressed
// Controls whether debug messages are outputted
exports.isQuiet = false;
/**
 * Sets the quiet mode for suppressing debug messages.
 * @param v - Boolean to enable or disable quiet mode
 */
function setQuiet(v) {
    exports.isQuiet = !!v;
}
//# sourceMappingURL=quiet.js.map