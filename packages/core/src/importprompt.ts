import { assert } from "console"
import { host } from "./host"
import { logError } from "./util"

function resolveGlobal(): any {
    if (typeof window !== "undefined")
        return window // Browser environment
    else if (typeof self !== "undefined") return self
    else if (typeof global !== "undefined") return global // Node.js environment
    throw new Error("Could not find global")
}

export async function importPrompt(
    ctx0: PromptContext,
    r: PromptScript,
    options?: {
        logCb?: (msg: string) => void
    }
) {
    const { filename } = r
    if (!filename) throw new Error("filename is required")

    const oldGlb: any = {}
    const glb: any = resolveGlobal()
    try {
        // override global context
        for (const field of Object.keys(ctx0)) {
            assert(!glb[field])
            oldGlb[field] = glb[field]
            glb[field] = (ctx0 as any)[field]
        }

        const modulePath = filename.startsWith("/")
            ? filename
            : host.path.join(host.projectFolder(), filename)
        const module = await import(modulePath)
        const main = module.default
        if (!main) throw new Error("default import function missing")
        if (typeof main !== "function")
            throw new Error("default export must be a function")
        await main(ctx0)
    } catch (err) {
        logError(err)
        throw err
    } finally {
        // restore global context
        for (const field of Object.keys(oldGlb)) {
            const v = oldGlb[field]
            if (v === undefined) delete glb[field]
            else glb[field] = oldGlb[field]
        }
    }
}
