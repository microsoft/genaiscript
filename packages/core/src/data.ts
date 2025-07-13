// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import {
  XLSX_REGEX,
  CSV_REGEX,
  INI_REGEX,
  TOML_REGEX,
  JSON5_REGEX,
  YAML_REGEX,
  XML_REGEX,
  MD_REGEX,
  MDX_REGEX,
  JSONL_REGEX,
} from "./constants.js";
import { CSVTryParse } from "./csv.js";
import { splitMarkdown } from "./frontmatter.js";
import { INITryParse } from "./ini.js";
import { JSON5TryParse } from "./json5.js";
import { TOMLTryParse } from "./toml.js";
import { XLSXParse } from "./xlsx.js";
import { XMLTryParse } from "./xml.js";
import { YAMLTryParse } from "./yaml.js";
import { resolveFileContent } from "./file.js";
import { TraceOptions } from "./trace.js";
import { host } from "./host.js";
import { fromBase64 } from "./base64.js";
import { JSONLTryParse } from "./jsonl.js";
import { tryValidateJSONWithSchema } from "./schema.js";
import type { CSVParseOptions, INIParseOptions, WorkspaceFile, XMLParseOptions } from "./types.js";

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
export async function dataTryParse(
  file: WorkspaceFile,
  options?: TraceOptions & XMLParseOptions & INIParseOptions & CSVParseOptions,
) {
  await resolveFileContent(file);

  const { filename, content, encoding } = file;
  let data: any;
  if (XLSX_REGEX.test(filename))
    data = await XLSXParse(
      encoding === "base64" ? fromBase64(content) : await host.readFile(filename),
    );
  else {
    if (CSV_REGEX.test(filename)) data = CSVTryParse(content, options);
    else if (INI_REGEX.test(filename)) data = INITryParse(content, options);
    else if (TOML_REGEX.test(filename)) data = TOMLTryParse(content);
    else if (JSON5_REGEX.test(filename)) data = JSON5TryParse(content, { repair: true });
    else if (YAML_REGEX.test(filename)) data = YAMLTryParse(content);
    else if (XML_REGEX.test(filename)) data = await XMLTryParse(content, options);
    else if (JSONL_REGEX.test(filename)) data = JSONLTryParse(content);
    else if (MD_REGEX.test(filename) || MDX_REGEX.test(filename))
      data = YAMLTryParse(splitMarkdown(content).frontmatter);
    else {
      return undefined; // unknown
    }
  }

  return tryValidateJSONWithSchema(data, options);
}
