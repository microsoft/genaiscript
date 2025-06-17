// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { splitMarkdown } from "./frontmatter.js";
import Mustache from "mustache";
import { jinjaRender } from "./jinja.js";
import type { ImportTemplateOptions } from "./types.js";

/**
 * Processes a markdown string by applying Mustache or Jinja templating.
 * Removes frontmatter, prompty roles, and XML tags before interpolation.
 * @param md The markdown string to process.
 * @param data The data for variable interpolation.
 * @param options Configuration for templating format, e.g., Mustache or Jinja.
 * @returns The processed markdown string with interpolated variables.
 */
export async function interpolateVariables(
  md: string,
  data: Record<string, any>,
  options?: ImportTemplateOptions,
): Promise<string> {
  if (!md || !data) return md;
  const { format } = options || {};
  // remove frontmatter
  let { content } = splitMarkdown(md);

  // remove prompty roles
  // https://github.com/microsoft/prompty/blob/main/runtime/prompty/prompty/parsers.py#L113C21-L113C77
  content = content.replace(/^\s*(system|user|assistant)\s*:\s*$/gim, "\n");

  if (content) {
    // remove xml tags
    // https://humanloop.com/docs/prompt-file-format
    if (format === "jinja") content = jinjaRender(content, data ?? {});
    else content = Mustache.render(content, data ?? {});
  }

  return content;
}

export const mustacheRender = Mustache.render;
