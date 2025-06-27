// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { join } from "node:path";
import { DOCX_HASH_LENGTH } from "./constants.js";
import { hash } from "./crypto.js";
import { host } from "./host.js";
import { HTMLToMarkdown } from "./html.js";
import { TraceOptions } from "./trace.js";
import { logVerbose } from "./util.js";
import { readFile, writeFile } from "node:fs/promises";
import { YAMLStringify } from "./yaml.js";
import { errorMessage, serializeError } from "./error.js";
import { resolveFileBytes } from "./filebytes.js";
import { filenameOrFileToFilename } from "./unwrappers.js";
import { ensureDir } from "./fs.js";
import { measure } from "./performance.js";
import { dotGenaiscriptPath } from "./workdir.js";
import type { DocxParseOptions, WorkspaceFile } from "./types.js";

async function computeHashFolder(
  filename: string,
  content: Uint8Array,
  options: TraceOptions & DocxParseOptions,
) {
  const { trace, ...rest } = options || {};
  const h = await hash([filename, content, rest], {
    readWorkspaceFiles: true,
    version: true,
    length: DOCX_HASH_LENGTH,
  });
  return dotGenaiscriptPath("cache", "docx", h);
}

/**
 * Parses a DOCX file and converts its content to text, HTML, or markdown format. Uses Mammoth for processing.
 *
 * @param file - The DOCX file to parse, either as a path string or a WorkspaceFile object.
 * @param options - Optional parameters including trace for logging, cache control, and output format (default is "markdown"). If cache is enabled, attempts to retrieve cached results.
 * @returns An object containing the parsed file content or an error message in case of failure. If caching is enabled and an error occurs, attempts to return cached results.
 */
export async function DOCXTryParse(
  file: string | WorkspaceFile,
  options?: TraceOptions & DocxParseOptions,
): Promise<{ file?: WorkspaceFile; error?: string }> {
  const { trace, cache, format = "markdown" } = options || {};
  const filename = filenameOrFileToFilename(file);
  const content = await resolveFileBytes(file, options);
  const folder = await computeHashFolder(filename, content, options);
  const resFilename = join(folder, "res.json");
  const readCache = async () => {
    if (cache === false) return undefined;
    try {
      const res = JSON.parse(
        await readFile(resFilename, {
          encoding: "utf-8",
        }),
      );
      logVerbose(`docx: cache hit at ${folder}`);
      return res;
    } catch {
      return undefined;
    }
  };

  {
    // try cache hit
    const cached = await readCache();
    if (cached) return cached;
  }

  const m = measure("parsers.docx");
  try {
    const input = content ? { buffer: Buffer.from(content) } : { path: host.resolvePath(filename) };

    const { extractRawText, convertToHtml } = await import("mammoth");

    let text: string;
    if (format === "html" || format === "markdown") {
      const results = await convertToHtml(input);
      if (format === "markdown")
        text = await HTMLToMarkdown(results.value, {
          trace,
          disableGfm: true,
        });
      else text = results.value;
    } else {
      const results = await extractRawText(input);
      text = results.value;
    }

    await ensureDir(folder);
    await writeFile(join(folder, "content.txt"), text);
    const res = { file: { filename, content: text } };
    await writeFile(resFilename, JSON.stringify(res));

    return res;
  } catch (error) {
    logVerbose(error);
    {
      // try cache hit
      const cached = await readCache();
      if (cached) return cached;
    }
    trace?.error(`reading docx`, error); // Log error if tracing is enabled
    await ensureDir(folder);
    await writeFile(join(folder, "error.txt"), YAMLStringify(serializeError(error)));
    return { error: errorMessage(error) };
  } finally {
    m();
  }
}
