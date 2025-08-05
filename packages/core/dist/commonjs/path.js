"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNodePath = createNodePath;
const node_path_1 = require("node:path");
const fs_js_1 = require("./fs.js");
const node_url_1 = require("node:url");
const sanitize_js_1 = require("./sanitize.js");
/**
 * Creates a frozen object that provides various path manipulation functions.
 * Includes methods for operations such as getting directory names, extensions, basename, joining paths, normalizing paths, resolving paths, checking if a path is absolute, and changing file extensions.
 * @returns A frozen object with methods for path handling.
 */
function createNodePath() {
    // Return a frozen object containing path manipulation functions.
    // These functions are imported from node:path and facilitate
    // various operations on file paths.
    return Object.freeze({
        parse: node_path_1.parse,
        dirname: node_path_1.dirname, // Get the directory name of a path
        extname: // Get the directory name of a path
        node_path_1.extname, // Get the extension of a path
        basename: // Get the extension of a path
        node_path_1.basename, // Get the basename of a path
        join: // Get the basename of a path
        node_path_1.join, // Join multiple path segments
        normalize: // Join multiple path segments
        node_path_1.normalize, // Normalize a path to remove redundant separators
        relative: // Normalize a path to remove redundant separators
        node_path_1.relative, // Get the relative path between two paths
        resolve: // Get the relative path between two paths
        node_path_1.resolve, // Resolve a sequence of paths to an absolute path
        isAbsolute: // Resolve a sequence of paths to an absolute path
        node_path_1.isAbsolute, // Check if a path is absolute
        changeext: // Check if a path is absolute
        fs_js_1.changeext,
        resolveFileURL: node_url_1.fileURLToPath,
        sanitize: sanitize_js_1.sanitizeFilename,
    });
}
//# sourceMappingURL=path.js.map