import debug from "debug"
const dbg = debug("genaiscript:evalprompt")

import { host } from "./host"
import MagicString from "magic-string"

/**
 * Evaluates a prompt script in the context of provided variables.
 * 
 * This function constructs an asynchronous function from the given script and context,
 * optionally generating source maps for debugging. It combines the context keys with
 * the script source, prepends and appends the necessary structure, and evaluates the
 * final code.
 *
 * @param ctx0 - Initial context containing variables for the script execution.
 * @param r - The prompt script containing the JavaScript source code and filename.
 * @param options - Optional settings for the evaluation process.
 * @param options.sourceMaps - Indicates whether to generate source maps for the script.
 * @param options.logCb - Optional callback for logging messages during evaluation.
 * @returns A promise that resolves to the result of the evaluated script function.
 */
export async function evalPrompt(
    ctx0: PromptContext,
    r: PromptScript,
    options?: {
        sourceMaps?: boolean
        logCb?: (msg: string) => void
    }
) {
    const { sourceMaps } = options || {}
    const ctx = Object.freeze<PromptContext>({
        ...ctx0,
    })
    const keys = Object.keys(ctx)
    const prefix = "async (" + keys.join(",") + ") => { 'use strict';\n"
    const suffix = "\n}"

    const jsSource = r.jsSource
    let src: string = [prefix, jsSource, suffix].join("")
    // source map
    if (r.filename && sourceMaps) {
        dbg("creating source map")
        const s = new MagicString(jsSource)
        s.prepend(prefix)
        s.append(suffix)
        dbg(`resolving path for ${r.filename}`)
        const source = host.path.resolve(r.filename)
        const map = s.generateMap({
            source,
            includeContent: true,
            hires: true,
        })
        const mapURL: string = map.toUrl()
        // split keywords as so that JS engine does not try to load "mapUrl"
        src += "\n//# source" + "MappingURL=" + mapURL
        dbg("appending sourceURL to source")
        src += "\n//# source" + "URL=" + source
    }

    // in principle we could cache this function (but would have to do that based on hashed body or sth)
    // but probably little point
    const fn = (0, eval)(src)
    dbg(`eval ${r.filename}`)
    return await fn(...Object.values(ctx))
}
