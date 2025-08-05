"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataTryParse = dataTryParse;
const constants_js_1 = require("./constants.js");
const csv_js_1 = require("./csv.js");
const frontmatter_js_1 = require("./frontmatter.js");
const ini_js_1 = require("./ini.js");
const json5_js_1 = require("./json5.js");
const toml_js_1 = require("./toml.js");
const xlsx_js_1 = require("./xlsx.js");
const xml_js_1 = require("./xml.js");
const yaml_js_1 = require("./yaml.js");
const file_js_1 = require("./file.js");
const base64_js_1 = require("./base64.js");
const jsonl_js_1 = require("./jsonl.js");
const schema_js_1 = require("./schema.js");
const host_js_1 = require("./host.js");
/**
 * Attempts to parse the provided file's content based on its detected format.
 *
 * @param file - The file to be parsed, containing filename, content, and encoding details.
 * @param options - Optional configuration for parsing, including trace and format-specific options.
 *   - Trace options: Includes settings for tracing during processing.
 *   - XML options: Includes configurations for XML parsing.
 *   - INI options: Includes configurations for INI parsing.
 *   - CSV options: Includes configurations for CSV parsing.
 * @returns Parsed data in the appropriate format based on the file extension, or `undefined` if the format is unsupported.
 */
async function dataTryParse(file, options) {
    await (0, file_js_1.resolveFileContent)(file);
    const runtimeHost = (0, host_js_1.resolveRuntimeHost)();
    const { filename, content, encoding } = file;
    let data;
    if (constants_js_1.XLSX_REGEX.test(filename))
        data = await (0, xlsx_js_1.XLSXParse)(encoding === "base64" ? (0, base64_js_1.fromBase64)(content) : await runtimeHost.readFile(filename));
    else {
        if (constants_js_1.CSV_REGEX.test(filename))
            data = (0, csv_js_1.CSVTryParse)(content, options);
        else if (constants_js_1.INI_REGEX.test(filename))
            data = (0, ini_js_1.INITryParse)(content, options);
        else if (constants_js_1.TOML_REGEX.test(filename))
            data = (0, toml_js_1.TOMLTryParse)(content);
        else if (constants_js_1.JSON5_REGEX.test(filename))
            data = (0, json5_js_1.JSON5TryParse)(content, { repair: true });
        else if (constants_js_1.YAML_REGEX.test(filename))
            data = (0, yaml_js_1.YAMLTryParse)(content);
        else if (constants_js_1.XML_REGEX.test(filename))
            data = await (0, xml_js_1.XMLTryParse)(content, options);
        else if (constants_js_1.JSONL_REGEX.test(filename))
            data = (0, jsonl_js_1.JSONLTryParse)(content);
        else if (constants_js_1.MD_REGEX.test(filename) || constants_js_1.MDX_REGEX.test(filename))
            data = (0, yaml_js_1.YAMLTryParse)((0, frontmatter_js_1.splitMarkdown)(content).frontmatter);
        else {
            return undefined; // unknown
        }
    }
    return (0, schema_js_1.tryValidateJSONWithSchema)(data, options);
}
//# sourceMappingURL=data.js.map