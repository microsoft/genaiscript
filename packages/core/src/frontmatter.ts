// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { filenameOrFileToContent } from "./unwrappers.js";
import { JSON5TryParse } from "./json5.js";
import { TOMLTryParse } from "./toml.js";
import { YAMLTryParse, YAMLStringify } from "./yaml.js";
import type { WorkspaceFile } from "./types.js";

/**
 * Parses the frontmatter section of a text input and attempts to convert it into a structured format.
 *
 * @param text The text or file content to parse. Can either be a raw string or a WorkspaceFile object.
 * @param options Optional parsing options:
 *   - format: Specifies the expected frontmatter format. Supported formats are "yaml", "json", "toml", or "text".
 *
 * @returns An object containing:
 *   - text: The raw frontmatter string.
 *   - value: The parsed frontmatter as a structured object, depending on the specified format.
 *   - endLine: The last line index of the frontmatter, if it exists.
 *   Returns `undefined` if no frontmatter is found.
 */
export function frontmatterTryParse(
  text: string | WorkspaceFile,
  options?: { format: "yaml" | "json" | "toml" | "text" },
): { text: string; value: any; endLine?: number } | undefined {
  text = filenameOrFileToContent(text);

  const { format = "yaml" } = options || {};
  const { frontmatter, endLine } = splitMarkdown(text);
  if (!frontmatter) return undefined;

  let res: any;
  switch (format) {
    case "text":
      res = frontmatter;
      break;
    case "json":
      res = JSON5TryParse(frontmatter);
      break;
    case "toml":
      res = TOMLTryParse(frontmatter);
      break;
    default:
      res = YAMLTryParse(frontmatter);
      break;
  }
  return { text: frontmatter, value: res, endLine };
}

/**
 * Splits a Markdown text into its frontmatter and content parts.
 *
 * @param text - The input text or a WorkspaceFile containing Markdown content.
 * @returns An object containing:
 *   - `frontmatter`: The extracted frontmatter as a string, if available.
 *   - `endLine`: The line number where the frontmatter ends, if applicable.
 *   - `content`: The remaining Markdown content after the frontmatter.
 */
export function splitMarkdown(text: string | WorkspaceFile): {
  frontmatter?: string;
  endLine?: number;
  content: string;
} {
  text = filenameOrFileToContent(text);
  if (!text) return { content: text };
  const lines = text.split(/\r?\n/g);
  const delimiter = "---";
  if (lines[0] !== delimiter) return { content: text };
  let end = 1;
  while (end < lines.length) {
    if (lines[end] === delimiter) break;
    end++;
  }
  if (end >= lines.length) return { frontmatter: text, content: "" };
  const frontmatter = lines.slice(1, end).join("\n");
  const content = lines.slice(end + 1).join("\n");
  return { frontmatter, content, endLine: end };
}

/**
 * Updates the frontmatter section of a given text and returns the updated content.
 *
 * @param text - The input text containing frontmatter and content.
 * @param newFrontmatter - An object representing the new frontmatter to merge or apply.
 *   Keys with `null` remove corresponding fields, keys with `undefined` are ignored.
 * @param options - Optional configuration for output format:
 *   - `format`: Specifies the frontmatter format ("yaml" or "json"). Defaults to "yaml".
 *
 * @returns The updated text with the modified frontmatter and existing content.
 *
 * @throws An error if the specified format is unsupported.
 */
export function updateFrontmatter(
  text: string,
  newFrontmatter: any,
  options?: { format: "yaml" | "json" },
): string {
  const { content = "" } = splitMarkdown(text);
  if (newFrontmatter === null) return content;

  const frontmatter = frontmatterTryParse(text, options)?.value ?? {};

  // merge object
  for (const [key, value] of Object.entries(newFrontmatter ?? {})) {
    if (value === null) {
      delete frontmatter[key];
    } else if (value !== undefined) {
      frontmatter[key] = value;
    }
  }

  const { format = "yaml" } = options || {};
  let fm: string;
  switch (format) {
    case "json":
      fm = JSON.stringify(frontmatter, null, 2);
      break;
    case "yaml":
      fm = YAMLStringify(frontmatter);
      break;
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
  return `---\n${fm}\n---\n${content}`;
}
