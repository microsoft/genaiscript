"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.DOCXTryParse = DOCXTryParse;
const node_path_1 = require("node:path");
const constants_js_1 = require("./constants.js");
const crypto_js_1 = require("./crypto.js");
const host_js_1 = require("./host.js");
const html_js_1 = require("./html.js");
const util_js_1 = require("./util.js");
const promises_1 = require("node:fs/promises");
const yaml_js_1 = require("./yaml.js");
const error_js_1 = require("./error.js");
const filebytes_js_1 = require("./filebytes.js");
const unwrappers_js_1 = require("./unwrappers.js");
const fs_js_1 = require("./fs.js");
const performance_js_1 = require("./performance.js");
const workdir_js_1 = require("./workdir.js");
async function computeHashFolder(filename, content, options) {
    const { trace, ...rest } = options || {};
    const h = await (0, crypto_js_1.hash)([filename, content, rest], {
        readWorkspaceFiles: true,
        version: true,
        length: constants_js_1.DOCX_HASH_LENGTH,
    });
    return (0, workdir_js_1.dotGenaiscriptPath)("cache", "docx", h);
}
/**
 * Parses a DOCX file and converts its content to text, HTML, or markdown format. Uses Mammoth for processing.
 *
 * @param file - The DOCX file to parse, either as a path string or a WorkspaceFile object.
 * @param options - Optional parameters including trace for logging, cache control, and output format (default is "markdown"). If cache is enabled, attempts to retrieve cached results.
 * @returns An object containing the parsed file content or an error message in case of failure. If caching is enabled and an error occurs, attempts to return cached results.
 */
async function DOCXTryParse(file, options) {
    const { trace, cache, format = "markdown" } = options || {};
    const runtimeHost = (0, host_js_1.resolveRuntimeHost)();
    const filename = (0, unwrappers_js_1.filenameOrFileToFilename)(file);
    const content = await (0, filebytes_js_1.resolveFileBytes)(file, options);
    const folder = await computeHashFolder(filename, content, options);
    const resFilename = (0, node_path_1.join)(folder, "res.json");
    const readCache = async () => {
        if (cache === false)
            return undefined;
        try {
            const res = JSON.parse(await (0, promises_1.readFile)(resFilename, {
                encoding: "utf-8",
            }));
            (0, util_js_1.logVerbose)(`docx: cache hit at ${folder}`);
            return res;
        }
        catch {
            return undefined;
        }
    };
    {
        // try cache hit
        const cached = await readCache();
        if (cached)
            return cached;
    }
    const m = (0, performance_js_1.measure)("parsers.docx");
    try {
        const input = content
            ? { buffer: Buffer.from(content) }
            : { path: runtimeHost.resolvePath(filename) };
        const { extractRawText, convertToHtml } = await import("mammoth");
        let text;
        if (format === "html" || format === "markdown") {
            const results = await convertToHtml(input);
            if (format === "markdown")
                text = await (0, html_js_1.HTMLToMarkdown)(results.value, {
                    trace,
                    disableGfm: true,
                });
            else
                text = results.value;
        }
        else {
            const results = await extractRawText(input);
            text = results.value;
        }
        await (0, fs_js_1.ensureDir)(folder);
        await (0, promises_1.writeFile)((0, node_path_1.join)(folder, "content.txt"), text);
        const res = { file: { filename, content: text } };
        await (0, promises_1.writeFile)(resFilename, JSON.stringify(res));
        return res;
    }
    catch (error) {
        (0, util_js_1.logVerbose)(error);
        {
            // try cache hit
            const cached = await readCache();
            if (cached)
                return cached;
        }
        trace?.error(`reading docx`, error); // Log error if tracing is enabled
        await (0, fs_js_1.ensureDir)(folder);
        await (0, promises_1.writeFile)((0, node_path_1.join)(folder, "error.txt"), (0, yaml_js_1.YAMLStringify)((0, error_js_1.serializeError)(error)));
        return { error: (0, error_js_1.errorMessage)(error) };
    }
    finally {
        m();
    }
}
//# sourceMappingURL=docx.js.map