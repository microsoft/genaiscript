"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateId = generateId;
const nanoid_1 = require("nanoid");
/**
 * Generates a unique identifier.
 *
 * @returns A unique identifier string.
 */
function generateId() {
    return (0, nanoid_1.nanoid)();
}
//# sourceMappingURL=id.js.map