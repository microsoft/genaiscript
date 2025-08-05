"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.nodeTryReadPackage = nodeTryReadPackage;
exports.nodeIsPackageTypeModule = nodeIsPackageTypeModule;
const debug_1 = __importDefault(require("debug"));
const dbg = (0, debug_1.default)("genaiscript:node:package");
const fs_js_1 = require("./fs.js");
/**
 * Reads and parses the `package.json` file located in the current directory.
 *
 * @returns A promise that resolves with the parsed contents of the `package.json` file as a NodePackage object.
 *          If the file cannot be read or parsed, the promise may reject with an error.
 */
async function nodeTryReadPackage() {
    return await (0, fs_js_1.tryReadJSON)("package.json");
}
/**
 * Determines if the package is of type "module" by reading the package.json file.
 *
 * @returns A promise that resolves to a boolean indicating if the package type is "module".
 */
async function nodeIsPackageTypeModule() {
    const pkg = await nodeTryReadPackage();
    dbg(`type: ${pkg?.type || ""}`);
    const isModule = pkg?.type === "module";
    return isModule;
}
//# sourceMappingURL=nodepackage.js.map