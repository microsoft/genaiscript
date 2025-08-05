"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getModulePaths = getModulePaths;
exports.moduleResolve = moduleResolve;
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
const node_module_1 = require("node:module");
const node_url_1 = require("node:url");
const node_path_1 = require("node:path");
function getModulePaths(metaOrModule) {
    if (metaOrModule && "url" in metaOrModule && metaOrModule.url) {
        // ESM: pass import.meta
        const __filename = (0, node_url_1.fileURLToPath)(metaOrModule.url);
        const __dirname = (0, node_path_1.dirname)(__filename);
        return { __filename, __dirname };
    }
    else if (metaOrModule && "filename" in metaOrModule && metaOrModule.filename) {
        // CJS: pass module
        const __filename = metaOrModule.filename;
        const __dirname = (0, node_path_1.dirname)(__filename);
        return { __filename, __dirname };
    }
    throw new Error("Invalid module context: pass import.meta (ESM) or module (CJS)");
}
/**
 * Resolves modules in CommonJS and ESM environments.
 * @param moduleName
 * @returns
 */
function moduleResolve(moduleName) {
    const isoRequire = typeof require !== "undefined"
        ? require
        : // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            (0, node_module_1.createRequire)(import.meta.url);
    return isoRequire.resolve(moduleName);
}
//# sourceMappingURL=pathUtils.js.map