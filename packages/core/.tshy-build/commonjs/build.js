"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildProject = buildProject;
const es_toolkit_1 = require("es-toolkit");
const node_path_1 = require("node:path");
const cleaners_js_1 = require("./cleaners.js");
const constants_js_1 = require("./constants.js");
const debug_js_1 = require("./debug.js");
const host_js_1 = require("./host.js");
const parser_js_1 = require("./parser.js");
const pathUtils_js_1 = require("./pathUtils.js");
const dbg = (0, debug_js_1.genaiscriptDebug)("cli:build");
const { __dirname } = typeof module !== "undefined" && module.filename
    ? (0, pathUtils_js_1.getModulePaths)(module)
    : // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        (0, pathUtils_js_1.getModulePaths)(import.meta);
/**
 * Asynchronously builds a project by parsing tool files.
 *
 * @param options - Optional configuration for building the project.
 * @param options.toolFiles - Specific tool files to include in the build.
 * @param options.toolsPath - Path or paths to search for tool files if none are provided.
 * @returns A promise that resolves to the newly parsed project structure.
 */
async function buildProject(options) {
    const runtimeHost = (0, host_js_1.resolveRuntimeHost)();
    const installDir = (0, node_path_1.dirname)((0, node_path_1.dirname)(__dirname)); // Use __dirname to resolve the installation directory
    const { toolFiles, toolsPath } = options || {};
    let scriptFiles = [];
    if (toolFiles?.length) {
        scriptFiles = toolFiles;
    }
    else {
        let tps = (0, cleaners_js_1.arrayify)(toolsPath).map((pattern) => ({
            pattern,
            applyGitIgnore: true,
        }));
        if (!tps?.length) {
            const config = await runtimeHost.config;
            tps = [];
            if (config.ignoreCurrentWorkspace) {
                dbg(`ignoring current workspace scripts`);
            }
            else
                tps.push({ pattern: constants_js_1.GENAI_ANYJS_GLOB, applyGitIgnore: true });
            tps.push(...(0, cleaners_js_1.arrayify)(config.include).map((pattern) => typeof pattern === "string"
                ? { pattern, applyGitIgnore: false }
                : {
                    pattern: pattern.pattern,
                    applyGitIgnore: !pattern.ignoreGitIgnore,
                }));
        }
        tps = (0, cleaners_js_1.arrayify)(tps);
        scriptFiles = [];
        for (const tp of tps) {
            dbg(`searching %s .gitignore: %s`, tp.pattern, tp.applyGitIgnore);
            const fs = await runtimeHost.findFiles(tp.pattern, {
                ignore: tp.applyGitIgnore ? `**/${constants_js_1.GENAISCRIPT_FOLDER}/**` : undefined,
                applyGitIgnore: tp.applyGitIgnore,
            });
            if (!fs?.length) {
                dbg(`no files found`);
            }
            scriptFiles.push(...fs);
        }
        dbg(`found script files: %O`, scriptFiles);
    }
    // filter out unwanted files
    scriptFiles = scriptFiles.filter((f) => constants_js_1.GENAI_ANY_REGEX.test(f));
    // Ensure that the script files are unique
    scriptFiles = (0, es_toolkit_1.uniq)(scriptFiles);
    // Parse the project using the determined script files
    const newProject = await (0, parser_js_1.parseProject)({
        installDir,
        scriptFiles,
    });
    // Return the newly parsed project structure
    return newProject;
}
//# sourceMappingURL=build.js.map