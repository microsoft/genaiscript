// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import debug from "debug";
const dbg = debug("genaiscript:evalprompt");

import { host } from "./host.js";
import type { PromptContext, PromptScript } from "./types.js";
import MagicString from "magic-string";

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
    const source = host.path.resolve(r.filename);
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

  // in principle we could cache this function (but would have to do that based on hashed body or sth)
  // but probably little point
  const fn = (0, eval)(src);
  dbg(`eval ${r.filename}`);
  return await fn(...Object.values(ctx));
}
