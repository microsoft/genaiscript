// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { splitMarkdown, frontmatterTryParse } from "./frontmatter.js";
import Mustache from "mustache";
import { jinjaRender } from "./jinja.js";
import type { ImportTemplateOptions } from "./types.js";

/**
 * Processes a markdown string by applying Mustache or Jinja templating.
 * Extracts frontmatter parameters and merges them with provided data before interpolation.
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
  if (!md) return md;
  const { format } = options || {};

  // Extract frontmatter and content
  let { content } = splitMarkdown(md);

  // Extract parameters from frontmatter and merge with provided data
  const frontmatter = frontmatterTryParse(md);
  let mergedData = { ...(data ?? {}) };

  if (frontmatter?.value) {
    // Extract default values from frontmatter parameters or inputs (prompty format)
    const frontmatterDefaults: Record<string, any> = {};
    const parameterSource = frontmatter.value.parameters || frontmatter.value.inputs;

    if (parameterSource) {
      for (const [key, param] of Object.entries(parameterSource)) {
        if (typeof param === "object" && param !== null && "default" in param) {
          // Only use frontmatter default if no data provided for this key
          if (!(key in mergedData)) {
            frontmatterDefaults[key] = param.default;
          }
        }
      }
      // Merge frontmatter defaults with provided data (data takes precedence)
      mergedData = { ...frontmatterDefaults, ...mergedData };
    }

    // Handle prompty sample data as defaults
    if (frontmatter.value.sample && typeof frontmatter.value.sample === "object") {
      for (const [key, value] of Object.entries(frontmatter.value.sample)) {
        if (!(key in mergedData)) {
          frontmatterDefaults[key] = value;
        }
      }
      mergedData = { ...frontmatterDefaults, ...mergedData };
    }
  }

  // remove prompty roles
  // https://github.com/microsoft/prompty/blob/main/runtime/prompty/prompty/parsers.py#L113C21-L113C77
  content = content.replace(/^\s*(system|user|assistant)\s*:\s*$/gim, "\n");

  if (content) {
    // remove xml tags
    // https://humanloop.com/docs/prompt-file-format
    if (format === "jinja") content = jinjaRender(content, mergedData);
    else content = Mustache.render(content, mergedData);
  }

  return content;
}

export const mustacheRender = Mustache.render;
