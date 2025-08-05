"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.computeFileEdits = computeFileEdits;
exports.writeFileEdits = writeFileEdits;
const changelog_js_1 = require("./changelog.js");
const csv_js_1 = require("./csv.js");
const llmdiff_js_1 = require("./llmdiff.js");
const error_js_1 = require("./error.js");
const unwrappers_js_1 = require("./unwrappers.js");
const fs_js_1 = require("./fs.js");
const glob_js_1 = require("./glob.js");
const host_js_1 = require("./host.js");
const json5_js_1 = require("./json5.js");
const parser_js_1 = require("./parser.js");
const schema_js_1 = require("./schema.js");
const util_js_1 = require("./util.js");
const yaml_js_1 = require("./yaml.js");
const fs_js_2 = require("./fs.js");
const diff_js_1 = require("./diff.js");
const node_path_1 = require("node:path");
/**
 * Computes file edits based on the specified runtime prompt result and processing options.
 *
 * @param res The result of the runtime prompt execution, containing text, annotations, fences, frames, and messages.
 * @param options Configuration options for processing the result:
 *   - trace: A trace object for logging details of the computation.
 *   - fileOutputs: A list of file output rules applied to edited files.
 *   - schemas: JSON schemas for validation of file outputs and content.
 *   - fileMerges: Handlers for custom merging of file content.
 *   - outputProcessors: Handlers for post-processing generated content and files.
 *
 * Performs the following operations:
 * - Processes fenced code blocks in the result to determine edits (file or diff).
 * - Applies changes to files based on their type:
 *   - Direct file updates.
 *   - Diff-based patches or merges.
 * - Processes changelogs to update relevant files.
 * - Executes custom output processors if specified.
 * - Validates file outputs against specified schemas or patterns.
 * - Generates structured edits for tracked file changes.
 * - Updates the result structure with computed edits, changelogs, annotations, and file modifications.
 * - Logs details of the computation process, including errors and skipped files.
 */
async function computeFileEdits(res, options) {
    const runtimeHost = (0, host_js_1.resolveRuntimeHost)();
    const { trace, fileOutputs, fileMerges, outputProcessors, schemas } = options || {};
    const { fences, frames, messages, usage } = res;
    let text = res.text;
    let annotations = res.annotations?.slice(0);
    const fileEdits = {};
    const changelogs = [];
    const edits = [];
    const projFolder = runtimeHost.projectFolder();
    // Helper function to get or create file edit object
    const getFileEdit = async (fn) => {
        fn = (0, util_js_1.relativePath)(projFolder, fn);
        let fileEdit = fileEdits[fn];
        if (!fileEdit) {
            let before = null;
            const after = undefined;
            if (await (0, fs_js_1.fileExists)(fn))
                before = await (0, fs_js_1.readText)(fn);
            fileEdit = fileEdits[fn] = { before, after };
        }
        return fileEdit;
    };
    for (const fence of fences.filter(({ validation }) => !validation?.schemaError)) {
        const { label: name, content: val, language } = fence;
        const pm = /^((file|diff):?)\s+/i.exec(name);
        if (pm) {
            const kw = pm[1].toLowerCase();
            const n = (0, unwrappers_js_1.unquote)(name.slice(pm[0].length).trim());
            const fn = /^[^\/]/.test(n) ? runtimeHost.resolvePath(projFolder, n) : n;
            const fileEdit = await getFileEdit(fn);
            if (kw === "file") {
                if (fileMerges.length) {
                    try {
                        for (const fileMerge of fileMerges)
                            fileEdit.after =
                                (await fileMerge(fn, "", // todo
                                fileEdit.after ?? fileEdit.before, val)) ?? val;
                    }
                    catch (e) {
                        (0, util_js_1.logVerbose)(e);
                        trace?.error(`error custom merging diff in ${fn}`, e);
                    }
                }
                else
                    fileEdit.after = val;
            }
            else if (kw === "diff") {
                const chunks = (0, llmdiff_js_1.parseLLMDiffs)(val);
                try {
                    fileEdit.after = (0, llmdiff_js_1.applyLLMPatch)(fileEdit.after || fileEdit.before, chunks);
                }
                catch (e) {
                    (0, util_js_1.logVerbose)(e);
                    trace?.error(`error applying patch to ${fn}`, e);
                    try {
                        fileEdit.after = (0, llmdiff_js_1.applyLLMDiff)(fileEdit.after || fileEdit.before, chunks);
                    }
                    catch (e) {
                        (0, util_js_1.logVerbose)(e);
                        trace?.error(`error merging diff in ${fn}`, e);
                    }
                }
            }
        }
        else if (/^changelog$/i.test(name) || /^changelog/i.test(language)) {
            changelogs.push(val);
            try {
                const cls = (0, changelog_js_1.parseChangeLogs)(val);
                for (const changelog of cls) {
                    const { filename } = changelog;
                    const fn = /^[^\/]/.test(filename) // TODO
                        ? runtimeHost.resolvePath(projFolder, filename)
                        : filename;
                    const fileEdit = await getFileEdit(fn);
                    fileEdit.after = (0, changelog_js_1.applyChangeLog)(fileEdit.after || fileEdit.before || "", changelog);
                }
            }
            catch (e) {
                (0, util_js_1.logError)(e);
                trace?.error(`error parsing changelog`, e);
                trace?.detailsFenced(`changelog`, val, "text");
            }
        }
    }
    // Apply user-defined output processors
    if (outputProcessors?.length) {
        const opTrace = trace?.startTraceDetails("🖨️ output processors");
        try {
            for (const outputProcessor of outputProcessors) {
                const { text: newText, files, annotations: oannotations, } = (await outputProcessor({
                    text,
                    fileEdits,
                    fences,
                    frames,
                    annotations,
                    schemas,
                    messages,
                    usage,
                })) || {};
                if (newText !== undefined) {
                    text = newText;
                    opTrace?.detailsFenced(`📝 text`, text);
                }
                if (files)
                    for (const [n, content] of Object.entries(files)) {
                        const fn = (0, node_path_1.isAbsolute)(n) ? n : runtimeHost.resolvePath(projFolder, n);
                        opTrace?.detailsFenced(`📁 file ${fn}`, content);
                        const fileEdit = await getFileEdit(fn);
                        fileEdit.after = content;
                        fileEdit.validation = { pathValid: true };
                    }
                if (oannotations)
                    annotations = oannotations.slice(0);
            }
        }
        catch (e) {
            if ((0, error_js_1.isCancelError)(e))
                throw e;
            (0, util_js_1.logError)(e);
            opTrace?.error(`output processor failed`, e);
        }
        finally {
            opTrace?.endDetails();
        }
    }
    // Validate and apply file outputs
    validateFileOutputs(fileOutputs, trace, fileEdits, schemas);
    // Convert file edits into structured edits
    Object.entries(fileEdits)
        .filter(([, { before, after }]) => before !== after) // ignore unchanged files
        .forEach(([fn, { before, after, validation }]) => {
        if (before) {
            edits.push({
                label: `Update ${fn}`,
                filename: fn,
                type: "replace",
                range: [[0, 0], (0, parser_js_1.stringToPos)(after)],
                text: after,
                validated: !validation?.schemaError && validation?.pathValid,
            });
        }
        else {
            edits.push({
                label: `Create ${fn}`,
                filename: fn,
                type: "createfile",
                text: after,
                overwrite: true,
                validated: !validation?.schemaError && validation?.pathValid,
            });
        }
    });
    if (edits.length)
        trace?.details("✏️ edits", (0, csv_js_1.dataToMarkdownTable)(edits, {
            headers: ["type", "filename", "message", "validated"],
        }));
    res.text = text;
    res.fileEdits = fileEdits;
    res.changelogs = changelogs;
    res.annotations = annotations;
    res.edits = edits;
}
// Validate file outputs against specified schemas and patterns
/**
 * Validates file outputs based on provided patterns and schemas.
 * @param fileOutputs List of file outputs to validate.
 * @param trace The markdown trace for logging.
 * @param fileEdits Record of file updates.
 * @param schemas The JSON schemas for validation.
 */
function validateFileOutputs(fileOutputs, trace, fileEdits, schemas) {
    if (fileOutputs?.length && Object.keys(fileEdits || {}).length) {
        trace?.startDetails("🗂 file outputs");
        try {
            for (const fileEditName of Object.keys(fileEdits)) {
                const fe = fileEdits[fileEditName];
                for (const fileOutput of fileOutputs) {
                    const { pattern, options } = fileOutput;
                    if ((0, glob_js_1.isGlobMatch)(fileEditName, pattern)) {
                        try {
                            trace?.startDetails(`📁 ${fileEditName}`);
                            trace?.itemValue(`pattern`, pattern);
                            const { schema: schemaId } = options || {};
                            if (/\.(json|yaml)$/i.test(fileEditName)) {
                                const { after } = fileEdits[fileEditName];
                                const data = /\.json$/i.test(fileEditName) ? (0, json5_js_1.JSON5parse)(after) : (0, yaml_js_1.YAMLParse)(after);
                                trace?.detailsFenced("📝 data", data);
                                if (schemaId) {
                                    const schema = schemas[schemaId];
                                    if (!schema)
                                        fe.validation = {
                                            schemaError: `schema ${schemaId} not found`,
                                        };
                                    else
                                        fe.validation = (0, schema_js_1.validateJSONWithSchema)(data, schema, {
                                            trace,
                                        });
                                }
                            }
                            else {
                                fe.validation = { pathValid: true };
                            }
                        }
                        catch (e) {
                            trace?.error((0, error_js_1.errorMessage)(e));
                            fe.validation = {
                                schemaError: (0, error_js_1.errorMessage)(e),
                            };
                        }
                        finally {
                            trace?.endDetails();
                        }
                        break;
                    }
                }
            }
        }
        finally {
            trace?.endDetails();
        }
    }
}
/**
 * Asynchronously writes file edits to disk.
 *
 * @param fileEdits - A record of file updates, including filename, original content, updated content, and validation details. Skips files with invalid schemas unless applyEdits is true.
 * @param options - Options for applying edits and tracing details:
 *   - applyEdits: If true, applies edits even if validation fails.
 *   - trace: A trace object for logging details, including skipped files, changes, and diff information.
 */
async function writeFileEdits(fileEdits, // Contains the edits to be applied to files
options) {
    const { applyEdits, trace } = options || {};
    // Iterate over each file edit entry
    for (const fileEdit of Object.entries(fileEdits || {})) {
        // Destructure the filename, before content, after content, and validation from the entry
        const [fn, { before, after, validation }] = fileEdit;
        if (!applyEdits && !validation?.pathValid) {
            // path not validated
            continue;
        }
        // Skip writing if the edit is invalid and applyEdits is false
        if (validation?.schemaError) {
            trace?.detailsFenced(`skipping ${fn}, invalid schema`, validation.schemaError, "text");
            continue;
        }
        // Check if there's a change between before and after content
        if (after !== before) {
            // Log whether the file is being updated or created
            (0, util_js_1.logVerbose)(`${before !== undefined ? `updating` : `creating`} ${fn}`);
            trace?.detailsFenced(`updating ${fn}`, (0, diff_js_1.diffCreatePatch)({ filename: fn, content: before }, { filename: fn, content: after }), "diff");
            // Write the new content to the file
            await (0, fs_js_2.writeText)(fn, after ?? before); // Write 'after' content if available, otherwise 'before'
        }
    }
}
//# sourceMappingURL=fileedits.js.map