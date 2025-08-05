"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createGitIgnorer = createGitIgnorer;
exports.createIgnorer = createIgnorer;
exports.filterGitIgnore = filterGitIgnore;
exports.gitIgnoreEnsure = gitIgnoreEnsure;
// Import the 'ignore' library to handle .gitignore file parsing and filtering
const ignore_1 = __importDefault(require("ignore"));
const fs_js_1 = require("./fs.js");
const constants_js_1 = require("./constants.js");
const host_js_1 = require("./host.js");
const util_js_1 = require("./util.js");
const debug_js_1 = require("./debug.js");
const unwrappers_js_1 = require("./unwrappers.js");
const node_path_1 = require("node:path");
const dbg = (0, debug_js_1.genaiscriptDebug)("files:gitignore");
/**
 * Creates a function to filter files based on patterns defined in .gitignore files.
 * Combines multiple .gitignore files (.gitignore, .gitignore.genai, and .genaiscriptignore)
 * into a single filtering logic.
 *
 * @returns A function that takes a list of files and returns only the files not ignored.
 */
async function createGitIgnorer(options) {
    const { extraFiles = [] } = options || {};
    dbg(`extra .gitignore files: ${extraFiles.join(", ")}`);
    return await createIgnorer([constants_js_1.GIT_IGNORE, constants_js_1.GIT_IGNORE_GENAI, constants_js_1.GENAISCRIPTIGNORE, ...extraFiles]);
}
async function createIgnorer(files) {
    const gitignores = (await Promise.all(files.map((f) => (0, fs_js_1.tryReadText)(f)))).filter(Boolean);
    if (!gitignores.length) {
        dbg("no .gitignore files found");
        dbg(`%O`, files);
        return (fs) => fs?.map(unwrappers_js_1.filenameOrFileToFilename)?.slice(0);
    }
    // Create an ignorer instance and add the .gitignore patterns to it
    dbg("creating ignorer instance");
    const ig = (0, ignore_1.default)({ allowRelativePaths: true });
    for (const gitignore of gitignores) {
        ig.add(gitignore);
    }
    return (files) => files ? ig.filter(files?.map(unwrappers_js_1.filenameOrFileToFilename)) : [];
}
/**
 * Filters a list of files based on the patterns specified in .gitignore files.
 * Utilizes the 'ignore' library to determine which files should be excluded.
 *
 * @param files - An array of file paths to be filtered.
 * @returns An array of files that are not ignored according to the .gitignore patterns.
 */
async function filterGitIgnore(files) {
    const ignorer = await createGitIgnorer();
    const newFiles = ignorer(files);
    dbg(`files ${files.length} -> ${newFiles.length}`);
    return newFiles;
}
/**
 * Ensures specified entries are present in the .gitignore file within the given directory.
 * If any of the entries are missing, they are appended to the file.
 *
 * @param dir - Directory path where the .gitignore file is located.
 * @param entries - List of patterns or file paths to ensure are included in the .gitignore file.
 */
async function gitIgnoreEnsure(dir, entries) {
    const runtimeHost = (0, host_js_1.resolveRuntimeHost)();
    const fn = (0, node_path_1.join)(dir, constants_js_1.GIT_IGNORE);
    dbg(`reading file ${fn}`);
    let src = (await (0, fs_js_1.tryReadText)(fn)) || "";
    const oldsrc = src;
    const newline = /\r\n/.test(src) ? "\r\n" : "\n";
    const lines = src.split(/\r?\n/g);
    for (const entry of entries) {
        dbg(`checking entry ${entry} in lines`);
        if (!lines.some((l) => l.startsWith(entry))) {
            if (src) {
                src += newline;
            }
            src += entry;
        }
    }
    if (oldsrc !== src) {
        (0, util_js_1.logVerbose)(`updating ${fn}`);
        await (0, fs_js_1.writeText)(fn, src);
    }
}
//# sourceMappingURL=gitignore.js.map