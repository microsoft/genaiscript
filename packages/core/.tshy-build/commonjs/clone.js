"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanedClone = cleanedClone;
const cleaners_js_1 = require("./cleaners.js");
/**
 * Creates a deep clone of the input object and removes any properties with empty values.
 *
 * @param o - The object to be cloned and cleaned.
 * @returns A cleaned, deep-cloned version of the input object with empty values removed.
 */
function cleanedClone(o) {
    const c = structuredClone(o);
    (0, cleaners_js_1.deleteEmptyValues)(c);
    return c;
}
//# sourceMappingURL=clone.js.map