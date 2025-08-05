"use strict";
/* eslint-disable prefer-const */
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.grepSearch = grepSearch;
const jsonl_js_1 = require("./jsonl.js");
const file_js_1 = require("./file.js");
const es_toolkit_1 = require("es-toolkit");
const liner_js_1 = require("./liner.js");
const cleaners_js_1 = require("./cleaners.js");
const gitignore_js_1 = require("./gitignore.js");
const debug_js_1 = require("./debug.js");
const fs_js_1 = require("./fs.js");
const cancellation_js_1 = require("./cancellation.js");
const host_js_1 = require("./host.js");
const dbg = (0, debug_js_1.genaiscriptDebug)("grep");
async function importRipGrep() {
    try {
        const { rgPath } = await import("@lvce-editor/ripgrep");
        dbg(`rg: %s`, rgPath);
        const rgStat = await (0, fs_js_1.tryStat)(rgPath);
        if (!rgStat?.isFile())
            throw new Error(`ripgrep not found at '${rgPath}'. Please reinstall genaiscript.`);
        return rgPath;
    }
    catch (e) {
        dbg(`%O`, e);
        throw e;
    }
}
/**
 * Executes a grep-like search across the workspace using ripgrep.
 *
 * @param pattern - The search pattern, either a string or a regular expression.
 * @param options - Optional settings to customize the search behavior:
 *   - `path`: Specifies one or more paths to search.
 *   - `glob`: Array of glob patterns to include or exclude files.
 *   - `readText`: When false, avoids reading file content.
 *   - `applyGitIgnore`: When false, bypasses .gitignore filtering.
 *   - Accepts other trace and workspace-specific options.
 * @returns An object containing:
 *   - `files`: List of files that matched the pattern.
 *   - `matches`: List of detailed matches including filenames and content with line numbers.
 */
async function grepSearch(pattern, options) {
    const runtimeHost = (0, host_js_1.resolveRuntimeHost)();
    const { cancellationToken, trace } = options || {};
    const rgPath = await importRipGrep();
    let { path: paths, glob: globs, readText, applyGitIgnore, debug } = options || {};
    globs = (0, cleaners_js_1.arrayify)(globs);
    paths = (0, cleaners_js_1.arrayify)(paths);
    const args = ["--json", "--multiline", "--context", "3"];
    if (debug)
        args.push("--debug");
    if (typeof pattern === "string") {
        args.push("--smart-case", pattern);
    }
    else {
        if (pattern.ignoreCase)
            args.push("--ignore-case");
        args.push(pattern.source);
    }
    if (globs)
        for (const glob of globs) {
            args.push("--glob");
            args.push(glob);
        }
    if (paths.length)
        args.push(...paths);
    else if (globs?.length)
        args.push(".");
    dbg(`args: %o`, args);
    const res = await runtimeHost.exec(undefined, rgPath, args, options);
    if (!res.stdout) {
        dbg(`no output: %s`, res.stderr);
        return { data: [], files: [], matches: [] };
    }
    const resl = (0, jsonl_js_1.JSONLTryParse)(res.stdout || "");
    (0, cancellation_js_1.checkCancelled)(cancellationToken);
    let filenames = (0, es_toolkit_1.uniq)(resl.filter(({ type }) => type === "match").map(({ data }) => data.path.text));
    if (applyGitIgnore !== false) {
        dbg(`apply git ignore`);
        filenames = await (0, gitignore_js_1.filterGitIgnore)(filenames);
    }
    const files = filenames.map((filename) => ({ filename }));
    const filesSet = new Set(filenames);
    const matches = resl
        .filter(({ type }) => type === "match")
        .filter(({ data }) => filesSet.has(data.path.text))
        .map(({ data }) => ({
        filename: data.path.text,
        content: (0, liner_js_1.addLineNumbers)(data.lines.text.trimEnd(), {
            startLine: data.line_number,
        }),
    }));
    dbg(`read text: `, readText);
    if (readText !== false)
        await (0, file_js_1.resolveFileContents)(files, { trace, cancellationToken });
    return { data: resl, files, matches };
}
//# sourceMappingURL=grep.js.map