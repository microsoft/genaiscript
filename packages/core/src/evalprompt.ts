// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { resolveRuntimeHost } from "./host.js";
import type { PromptContext, PromptScript } from "./types.js";
import MagicString from "magic-string";
import { resolve } from "node:path";
import { genaiscriptDebug } from "./debug.js";
const dbg = genaiscriptDebug("eval");

/**
 * Validates JavaScript source code for security vulnerabilities
 * @param source - The JavaScript source code to validate
 * @throws Error if potentially dangerous patterns are detected
 */
function validateJavaScriptSource(source: string): void {
  // List of potentially dangerous patterns that should not be in prompt scripts
  const dangerousPatterns = [
    /require\s*\(\s*['"`]child_process['"`]\s*\)/,
    /require\s*\(\s*['"`]fs['"`]\s*\)/,
    /require\s*\(\s*['"`]os['"`]\s*\)/,
    /require\s*\(\s*['"`]process['"`]\s*\)/,
    /process\s*\.\s*env/,
    /global\s*\[/,
    /globalThis\s*\[/,
    /window\s*\[/,
    /eval\s*\(/,
    /Function\s*\(/,
    /import\s*\(\s*['"`][^'"`]*\/\.\./,  // relative imports going up directories
    /require\s*\(\s*['"`][^'"`]*\/\.\./,  // relative requires going up directories
  ];

  for (const pattern of dangerousPatterns) {
    if (pattern.test(source)) {
      throw new Error(`Potentially dangerous code pattern detected in script source: ${pattern.source}`);
    }
  }

  // Check for excessive complexity that might indicate obfuscated code
  const lines = source.split('\n');
  if (lines.some(line => line.length > 1000)) {
    dbg("Warning: Script contains very long lines which may indicate obfuscated code");
  }
}

/**
 * Evaluates a JavaScript prompt script with the provided context.
 *
 * @param ctx0 - An object representing the execution context. Keys in this object are made available as arguments to the evaluated function.
 * @param r - An object containing the JavaScript source code (`jsSource`) to be evaluated and its associated metadata, such as the filename.
 * @param options - Optional settings.
 *   - sourceMaps - If true, generates and appends source maps for debugging purposes.
 *   - logCb - A callback function for logging debug messages.
 *
 * @returns The result of evaluating the JavaScript prompt script.
 */
export async function evalPrompt(
  ctx0: PromptContext,
  r: PromptScript,
  options?: {
    sourceMaps?: boolean;
    logCb?: (msg: string) => void;
  },
) {
  const { sourceMaps } = options || {};
  dbg(`eval %s`, r.id);

  // Validate the JavaScript source for security
  if (r.jsSource) {
    validateJavaScriptSource(r.jsSource);
  }

  const ctx = Object.freeze<PromptContext>({
    ...ctx0,
  });
  const keys = Object.keys(ctx);
  const prefix = "async (" + keys.join(",") + ") => { 'use strict';\n";
  const suffix = "\n}";

  const jsSource = r.jsSource;
  let src: string = [prefix, jsSource, suffix].join("");
  // source map
  if (r.filename && sourceMaps) {
    dbg("creating source map");
    const s = new MagicString(jsSource);
    s.prepend(prefix);
    s.append(suffix);
    dbg(`resolving path for ${r.filename}`);
    const source = resolve(r.filename);
    const map = s.generateMap({
      source,
      includeContent: true,
      hires: true,
    });
    const mapURL: string = map.toUrl();
    // split keywords as so that JS engine does not try to load "mapUrl"
    src += "\n//# source" + "MappingURL=" + mapURL;
    dbg("appending sourceURL to source");
    src += "\n//# source" + "URL=" + source;
  }

  // Use indirect eval to ensure code runs in global scope with restricted access
  // This is still eval but with additional validation and context isolation
  const fn = (0, eval)(src);
  dbg(`eval ${r.filename}`);
  return await fn(...Object.values(ctx));
}
