"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.RIPGREP_DIST_VERSION = exports.PDFJS_DIST_VERSION = exports.GITHUB_REPO = exports.VSCODE_CLI_VERSION = exports.CORE_VERSION = void 0;
const node_fs_1 = require("node:fs");
const pathUtils_js_1 = require("./pathUtils.js");
const node_path_1 = require("node:path");
const { __dirname } = typeof module !== "undefined" && module.filename
    ? (0, pathUtils_js_1.getModulePaths)(module)
    : // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        (0, pathUtils_js_1.getModulePaths)(import.meta);
/**
 * Returns true if the package.json is a "tshy" file (only { "type": ... }).
 */
function isTshyPackageJson(path) {
    try {
        const pkg = JSON.parse((0, node_fs_1.readFileSync)(path, "utf8"));
        const keys = Object.keys(pkg);
        return keys.length === 1 && keys[0] === "type";
    }
    catch {
        return false;
    }
}
/**
 * Walks up from the current directory to find the first non-tshy package.json.
 * Throws if not found.
 */
function findRealPackageJson(startDir) {
    let dir = startDir;
    let pkgPath;
    while (dir !== "/") {
        pkgPath = (0, node_path_1.join)(dir, "package.json");
        if ((0, node_fs_1.existsSync)(pkgPath)) {
            if (!isTshyPackageJson(pkgPath)) {
                return { path: pkgPath, json: JSON.parse((0, node_fs_1.readFileSync)(pkgPath, "utf8")) };
            }
        }
        dir = (0, node_path_1.dirname)(dir);
    }
    throw new Error("No real package.json found");
}
const { json: packageJson } = findRealPackageJson(__dirname);
/**
 * The current version of the core package.
 */
exports.CORE_VERSION = packageJson.version;
exports.VSCODE_CLI_VERSION = exports.CORE_VERSION;
/**
 * GitHub repository URL.
 */
exports.GITHUB_REPO = packageJson.repository;
exports.PDFJS_DIST_VERSION = packageJson.dependencies?.["pdfjs-dist"];
exports.RIPGREP_DIST_VERSION = packageJson.optionalDependencies?.["@lvce-editor/ripgrep"];
/**
 * Usage example (ESM):
 *   import { CORE_VERSION } from "./version.js";
 *   console.log(CORE_VERSION);
 *
 * Usage example (CJS):
 *   const { CORE_VERSION } = require("./version.js");
 *   console.log(CORE_VERSION);
 */
//# sourceMappingURL=version.js.map