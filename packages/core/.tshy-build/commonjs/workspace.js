"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWorkspaceFileSystem = createWorkspaceFileSystem;
const debug_1 = __importDefault(require("debug"));
const dbg = (0, debug_1.default)("genaiscript:workspace");
const promises_1 = require("node:fs/promises");
const constants_js_1 = require("./constants.js");
const csv_js_1 = require("./csv.js");
const data_js_1 = require("./data.js");
const error_js_1 = require("./error.js");
const file_js_1 = require("./file.js");
const fs_js_1 = require("./fs.js");
const host_js_1 = require("./host.js");
const ini_js_1 = require("./ini.js");
const json5_js_1 = require("./json5.js");
const cleaners_js_1 = require("./cleaners.js");
const xml_js_1 = require("./xml.js");
const yaml_js_1 = require("./yaml.js");
const node_path_1 = require("node:path");
const cache_js_1 = require("./cache.js");
const schema_js_1 = require("./schema.js");
/**
 * Creates a file system interface for interacting with workspace files.
 *
 * @returns An object implementing the WorkspaceFileSystem functionalities, excluding "grep" and "writeCached".
 *
 * Functions:
 * - `findFiles(glob, options)`: Searches for files matching a glob pattern. Filters out `.env` files and adheres to gitignore settings. The `options` object can include:
 *   - `readText`: Whether to read file contents (default: true).
 *   - `ignore`: Patterns to ignore during the search.
 *   - `applyGitIgnore`: Whether to apply gitignore rules (default: true).
 * - `writeText(filename, c)`: Writes `c` (content) to the specified `filename`. Throws error if writing to `.env` files.
 * - `appendText(filename, c)`: Appends `c` (content) to the specified `filename`. Throws error if writing to `.env` files.
 * - `readText(f)`: Reads the content of a file or a WorkspaceFile object. Throws if the file name is missing.
 * - `readJSON(f, options)`: Reads and parses JSON content from the given file or WorkspaceFile. Optionally validates with a schema.
 * - `readYAML(f, options)`: Reads and parses YAML content from the given file or WorkspaceFile. Optionally validates with a schema.
 * - `readXML(f, options)`: Reads and parses XML content from the given file or WorkspaceFile. The `options` parameter supports parsing configuration and schema validation.
 * - `readCSV(f, options)`: Reads and parses CSV content into an array of objects. Accepts `options` for CSV parsing customization and schema validation.
 * - `readINI(f, options)`: Reads and parses INI content into an object. Accepts `options` for default value configuration and parsing, and schema validation.
 * - `readData(f, options)`: Reads a generic data file and applies parsing logic. Optionally validates with a schema.
 * - `cache(name)`: Retrieves a JSON line-based cache by `name`. Throws error if `name` is missing.
 * - `stat(filename)`: Retrieves the size and mode (permissions) of the specified file. Returns `undefined` if the file does not exist.
 * - `copyFile(src, dest)`: Copies a file from `src` to `dest`. Throws error if `.env` files are involved.
 * - `writeFiles(files)`: Writes a batch of WorkspaceFile objects to the file system. Supports encoding (e.g., base64) if specified.
 */
function createWorkspaceFileSystem() {
    const checkWrite = (filename) => {
        if (constants_js_1.DOT_ENV_REGEX.test(filename)) {
            throw new Error("writing .env not allowed");
        }
    };
    const fs = {
        findFiles: async (glob, options) => {
            dbg(`findFiles: ${JSON.stringify(options)}`);
            const { readText, ignore, applyGitIgnore } = options || {};
            const runtimeHost = (0, host_js_1.resolveRuntimeHost)();
            const names = (await runtimeHost.findFiles(glob, {
                ignore: ["**/.env", ...(0, cleaners_js_1.arrayify)(ignore)],
                applyGitIgnore: applyGitIgnore !== false,
            })).filter((f) => !constants_js_1.DOT_ENV_REGEX.test(f));
            const files = [];
            for (const filename of names) {
                const file = readText === false
                    ? {
                        filename,
                    }
                    : await fs.readText(filename);
                files.push(file);
            }
            return files;
        },
        writeText: async (filename, c) => {
            checkWrite(filename);
            await (0, fs_js_1.writeText)(filename, c);
        },
        appendText: async (filename, c) => {
            checkWrite(filename);
            await (0, fs_js_1.appendText)(filename, c);
        },
        readText: async (f) => {
            if (f === undefined) {
                throw new error_js_1.NotSupportedError("missing file name");
            }
            const file = typeof f === "string"
                ? {
                    filename: f,
                    content: undefined,
                }
                : await f;
            if (constants_js_1.DOT_ENV_REGEX.test(file.filename)) {
                dbg(`filename matches DOT_ENV_REGEX: ${file.filename}`);
                return file;
            }
            try {
                dbg(`resolving file content for: ${file.filename}`);
                await (0, file_js_1.resolveFileContent)(file);
            }
            catch (e) {
                dbg(`error reading file ${file.filename}: ${(0, error_js_1.errorMessage)(e)}`);
            }
            return file;
        },
        readJSON: async (f, options) => {
            const file = await fs.readText(f);
            const res = (0, json5_js_1.JSON5TryParse)(file.content, undefined);
            return (0, schema_js_1.tryValidateJSONWithSchema)(res, options);
        },
        readYAML: async (f, options) => {
            const file = await fs.readText(f);
            const res = (0, yaml_js_1.YAMLTryParse)(file.content);
            return (0, schema_js_1.tryValidateJSONWithSchema)(res, options);
        },
        readXML: async (f, options) => {
            const file = await fs.readText(f);
            const res = await (0, xml_js_1.XMLTryParse)(file.content, options);
            return (0, schema_js_1.tryValidateJSONWithSchema)(res, options);
        },
        readCSV: async (f, options) => {
            const file = await fs.readText(f);
            const res = (0, csv_js_1.CSVTryParse)(file.content, options);
            return (0, schema_js_1.tryValidateJSONWithSchema)(res, options);
        },
        readINI: async (f, options) => {
            const file = await fs.readText(f);
            const res = (0, ini_js_1.INITryParse)(file.content, options?.defaultValue);
            return (0, schema_js_1.tryValidateJSONWithSchema)(res, options);
        },
        readData: async (f, options) => {
            const file = await f;
            const data = await (0, data_js_1.dataTryParse)((0, file_js_1.toWorkspaceFile)(file), options);
            return data;
        },
        cache: async (name) => {
            const res = (0, cache_js_1.createCache)(name, { type: "fs" });
            return res;
        },
        stat: async (filename) => {
            const stat = await (0, fs_js_1.tryStat)(filename);
            return stat ? { size: stat.size, mode: stat.mode } : undefined;
        },
        copyFile: async (src, dest) => {
            if (constants_js_1.DOT_ENV_REGEX.test(src) || constants_js_1.DOT_ENV_REGEX.test(dest)) {
                throw new Error("copying .env not allowed");
            }
            dbg(`copying file from ${src} to ${dest}`);
            await (0, promises_1.mkdir)((0, node_path_1.dirname)(dest), { recursive: true });
            await (0, promises_1.copyFile)(src, dest);
        },
        writeFiles: async (files) => {
            for (const file of (0, cleaners_js_1.arrayify)(files)) {
                const { filename, content, encoding } = file;
                checkWrite(filename);
                if (!encoding)
                    await fs.writeText(file.filename, file.content);
                else if (encoding === "base64") {
                    const buf = Buffer.from(content, "base64");
                    await (0, promises_1.writeFile)(filename, buf);
                }
            }
        },
    };
    fs.readFile = fs_js_1.readText;
    return Object.freeze(fs);
}
//# sourceMappingURL=workspace.js.map