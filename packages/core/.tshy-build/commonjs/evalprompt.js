"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.evalPrompt = evalPrompt;
const magic_string_1 = __importDefault(require("magic-string"));
const node_path_1 = require("node:path");
const debug_js_1 = require("./debug.js");
const dbg = (0, debug_js_1.genaiscriptDebug)("eval");
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
async function evalPrompt(ctx0, r, options) {
    const { sourceMaps } = options || {};
    dbg(`eval %s`, r.id);
    const ctx = Object.freeze({
        ...ctx0,
    });
    const keys = Object.keys(ctx);
    const prefix = "async (" + keys.join(",") + ") => { 'use strict';\n";
    const suffix = "\n}";
    const jsSource = r.jsSource;
    let src = [prefix, jsSource, suffix].join("");
    // source map
    if (r.filename && sourceMaps) {
        dbg("creating source map");
        const s = new magic_string_1.default(jsSource);
        s.prepend(prefix);
        s.append(suffix);
        dbg(`resolving path for ${r.filename}`);
        const source = (0, node_path_1.resolve)(r.filename);
        const map = s.generateMap({
            source,
            includeContent: true,
            hires: true,
        });
        const mapURL = map.toUrl();
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
//# sourceMappingURL=evalprompt.js.map