// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import debug from "debug";
const dbg = debug("genaiscript:tools");

import { parseModelIdentifier } from "./models.js";
import { providerFeatures } from "./features.js";

/**
 * Escapes a tool name by sanitizing it according to specific rules.
 *
 * Replaces non-alphanumeric characters (excluding underscores and hyphens) with underscores.
 * Replaces hyphens with underscores.
 * Collapses multiple consecutive underscores into a single underscore.
 * Removes trailing underscores from the resulting string.
 *
 * @param name The tool name to be escaped.
 * @returns The sanitized tool name.
 */
export function escapeToolName(name: string) {
  return name
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace("-", "_")
    .replace(/_{2,}/g, "_")
    .replace(/_+$/, "");
}

/**
 * Determines if tools are supported for a given model.
 *
 * @param modelId - The identifier of the model to check tools support.
 * @returns `true` if tools are supported, `false` if not supported, or `undefined` if unknown.
 *
 * The function examines the model's provider and family from the parsed model ID.
 * It checks the `providerFeatures` data for explicit tool support configurations.
 * If no configuration is found, it applies additional restrictions based on the family name.
 * Models with family names matching the restricted patterns (e.g., "o1-mini" or "o1-preview") are not supported.
 */
export function isToolsSupported(modelId: string): boolean | undefined {
  if (!modelId) {
    return undefined;
  }
  const { provider, family } = parseModelIdentifier(modelId);

  dbg(`searching for provider info for provider: ${provider}`);
  const info = providerFeatures(provider);
  if (info) {
    dbg(`tools support is explicitly disabled for model family: ${family}`);
    const value = info.models?.[family]?.tools;
    if (typeof value === "boolean") {
      dbg(`model family ${family} = ${value}`);
      return value;
    }
    dbg(`tools support is explicitly disabled for provider: ${provider}`);
    if (info.tools === false) {
      return false;
    }
  }

  dbg(`checking if model family matches restricted o1 patterns: ${family}`);
  if (/^o1-(mini|preview)/.test(family)) {
    return false;
  }

  dbg(`model family tool support is undefined: ${family}`);
  return undefined;
}
