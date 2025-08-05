"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.stringToPos = stringToPos;
exports.parseProject = parseProject;
const util_js_1 = require("./util.js"); // String comparison function
const template_js_1 = require("./template.js"); // Function to parse scripts
const fs_js_1 = require("./fs.js"); // Function to read text from a file
const constants_js_1 = require("./constants.js"); // Constants for MIME types and prefixes
const systems_js_1 = require("./systems.js");
const vars_js_1 = require("./vars.js");
const node_path_1 = require("node:path");
const promises_1 = require("node:fs/promises");
const es_toolkit_1 = require("es-toolkit");
const debug_js_1 = require("./debug.js");
const dbg = (0, debug_js_1.genaiscriptDebug)("parser");
/**
 * Converts a string to a character position represented as [row, column].
 * Uses newline characters to calculate the row (number of newlines) and column (characters after the last newline).
 * If the string is empty, returns [0, 0].
 * @param str - The input string to convert.
 * @returns The position as [row, column].
 */
function stringToPos(str) {
    if (!str)
        return [0, 0]; // Return default position if string is empty
    return [str.replace(/[^\n]/g, "").length, str.replace(/[^]*\n/, "").length];
}
/**
 * Parses a project based on the provided script files.
 * Initializes a project, reads system and user scripts, and updates with parsed templates.
 * Filters invalid or duplicate scripts and sorts templates.
 * Computes resolved systems and input schemas for non-system scripts.
 * @param options - Contains an array of script file paths to process.
 * @returns Project - The project with processed templates and diagnostics.
 */
async function parseProject(options) {
    const { installDir, scriptFiles } = options;
    const genaisrcDir = (0, node_path_1.resolve)(installDir, "genaisrc"); // ignore esbuild warning
    dbg(`genaisrc: %s`, genaisrcDir);
    const prj = {
        systemDir: genaisrcDir,
        scripts: [],
        diagnostics: [],
    };
    const systemPrompts = await (await (0, promises_1.readdir)(genaisrcDir)).filter((f) => constants_js_1.GENAI_ANYTS_REGEX.test(f));
    dbg(`system prompts: %d`, systemPrompts.length);
    // Process each script file, parsing its content and updating the project
    const scripts = {};
    for (const fn of systemPrompts) {
        const f = (0, node_path_1.join)(genaisrcDir, fn);
        const tmpl = await (0, template_js_1.parsePromptScript)(f, await (0, fs_js_1.readText)(f));
        if (!tmpl) {
            (0, util_js_1.logWarn)(`skipping invalid system script: ${fn}`);
            continue;
        } // Skip if no template is parsed
        prj.scripts.push(tmpl); // Add to project templates
        scripts[tmpl.id] = tmpl;
    }
    dbg(`user scripts: %d`, scriptFiles.length);
    for (const f of (0, es_toolkit_1.uniq)(scriptFiles).filter((f) => (0, node_path_1.resolve)((0, node_path_1.dirname)(f)) !== genaisrcDir)) {
        const tmpl = await (0, template_js_1.parsePromptScript)(f, await (0, fs_js_1.readText)(f));
        if (!tmpl) {
            (0, util_js_1.logWarn)(`skipping invalid script ${f}`);
            continue;
        } // Skip if no template is parsed
        if (scripts[tmpl.id]) {
            (0, util_js_1.logWarn)(`duplicate script '${tmpl.id}' (${f})`);
            (0, util_js_1.logVerbose)(`  already defined in ${scripts[tmpl.id].filename}`);
            continue;
        }
        prj.scripts.push(tmpl); // Add t
        scripts[tmpl.id] = tmpl;
    }
    /**
     * Generates a sorting key for a PromptScript
     * Determines priority based on whether a script is unlisted or has a filename.
     * @param t - The PromptScript to generate the key for.
     * @returns string - The sorting key.
     */
    function templKey(t) {
        const pref = t.unlisted ? "Z" : t.filename ? "A" : "B"; // Determine prefix for sorting
        return pref + t.title + t.id; // Concatenate for final sorting key
    }
    // Sort templates by the generated key
    prj.scripts.sort((a, b) => (0, util_js_1.strcmp)(templKey(a), templKey(b)));
    // compute systems
    prj.scripts
        .filter((s) => !s.isSystem)
        .forEach((s) => {
        s.resolvedSystem = (0, systems_js_1.resolveSystems)(prj, s);
        s.inputSchema = (0, vars_js_1.resolveScriptParametersSchema)(prj, s);
    });
    return prj; // Return the fully parsed project
}
//# sourceMappingURL=parser.js.map