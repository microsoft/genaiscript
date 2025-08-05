"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.dotGenaiscriptPath = dotGenaiscriptPath;
exports.ensureDotGenaiscriptPath = ensureDotGenaiscriptPath;
exports.getRunDir = getRunDir;
exports.getTestDir = getTestDir;
exports.getConvertDir = getConvertDir;
exports.createVideoDir = createVideoDir;
exports.createStatsDir = createStatsDir;
const node_path_1 = require("node:path");
const constants_js_1 = require("./constants.js");
const crypto_js_1 = require("./crypto.js");
const debug_js_1 = require("./debug.js");
const fs_js_1 = require("./fs.js");
const gitignore_js_1 = require("./gitignore.js");
const host_js_1 = require("./host.js");
const sanitize_js_1 = require("./sanitize.js");
const dbg = (0, debug_js_1.genaiscriptDebug)("dirs");
/**
 * Constructs a resolved file path within the `.genaiscript` directory of the project.
 *
 * @param segments - Additional path segments to append to the `.genaiscript` directory path.
 * @returns The resolved path as a string.
 */
function dotGenaiscriptPath(...segments) {
    const runtimeHost = (0, host_js_1.resolveRuntimeHost)();
    return (0, node_path_1.resolve)(runtimeHost.projectFolder(), constants_js_1.GENAISCRIPT_FOLDER, ...segments.map((s) => (0, sanitize_js_1.sanitizeFilename)(s)));
}
/**
 * Ensures the existence of the base `.genaiscript` directory.
 *
 * This function creates the `.genaiscript` directory at the root of the project folder
 * and ensures that the directory is properly configured by adding a `.gitignore` file
 * to ignore all contents inside this directory.
 *
 * @param None - This function does not accept any parameters.
 * @returns A promise that resolves once the directory is created and configured.
 */
async function ensureDotGenaiscriptPath() {
    const dir = dotGenaiscriptPath();
    await (0, fs_js_1.ensureDir)(dir);
    await (0, gitignore_js_1.gitIgnoreEnsure)(dir, ["*"]);
}
function friendlyDate() {
    return new Date().toISOString().replace(/[:.]/g, "-");
}
function createDatedFolder(id) {
    const name = friendlyDate() + "-" + id;
    return name;
}
/**
 * Generates the directory path for a specific run under the `.genaiscript` folder structure.
 *
 * @param scriptId - Identifier or file path of the script. The base name of the script will be extracted and processed.
 * @param runId - Unique identifier for the run. It will be combined with a timestamp to name the folder.
 * @returns The resolved path for the specified run directory.
 */
function getRunDir(scriptId, runId) {
    dbg(`run: %s %s`, scriptId, runId);
    const name = createDatedFolder(runId);
    const out = dotGenaiscriptPath(constants_js_1.RUNS_DIR_NAME, (0, node_path_1.basename)(scriptId).replace(constants_js_1.GENAI_ANYTS_REGEX, ""), name);
    dbg("run dir: %s", out);
    return out;
}
function getTestDir(runId) {
    dbg(`test: %s`, runId);
    const name = createDatedFolder(runId);
    const out = dotGenaiscriptPath("tests", name);
    dbg("test dir: %s", out);
    return out;
}
/**
 * Generates a directory path for storing converted files.
 *
 * @param scriptId - Identifier of the script. Used to create a unique directory path.
 *                   The base name of the scriptId is sanitized by removing
 *                   matches to GENAI_ANYTS_REGEX.
 * @returns A string representing the full path of the newly created directory
 *          for the converted files.
 */
function getConvertDir(scriptId) {
    const runId = (0, crypto_js_1.randomHex)(6);
    dbg(`convert: %s %s`, scriptId, runId);
    const name = createDatedFolder(runId);
    const out = dotGenaiscriptPath(constants_js_1.CONVERTS_DIR_NAME, (0, node_path_1.basename)(scriptId).replace(constants_js_1.GENAI_ANYTS_REGEX, ""), name);
    dbg("convert dir: %s", out);
    return out;
}
/**
 * Creates a directory for storing videos.
 *
 * @returns The path to the created video directory.
 *
 * This function resolves the path for a "videos" directory within the
 * `.genaiscript` folder, appends a timestamped folder name, ensures the
 * directory's existence, and returns the directory path.
 */
async function createVideoDir() {
    const dir = dotGenaiscriptPath("videos", friendlyDate());
    await (0, fs_js_1.ensureDir)(dir);
    return dir;
}
/**
 * Creates the statistics directory if it does not already exist.
 *
 * @returns The path to the statistics directory.
 *
 * This function resolves the path to the statistics directory under the
 * predefined `STATS_DIR_NAME` within the `.genaiscript` folder. It ensures
 * the directory exists by creating it if necessary.
 */
async function createStatsDir() {
    const statsDir = dotGenaiscriptPath(constants_js_1.STATS_DIR_NAME);
    await (0, fs_js_1.ensureDir)(statsDir);
    return statsDir;
}
//# sourceMappingURL=workdir.js.map