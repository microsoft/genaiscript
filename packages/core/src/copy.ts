import { PromptScript } from "./ast"
import { GENAI_JS_EXT, GENAI_SRC } from "./constants"
import { host } from "./host"
import { fileExists, writeText } from "./fs"

function promptPath(id: string) {
    const prompts = host.resolvePath(host.projectFolder(), GENAI_SRC)
    if (id === null) return prompts
    return host.resolvePath(prompts, id + GENAI_JS_EXT)
}
export async function copyPrompt(
    t: PromptScript,
    options: { fork: boolean; name?: string }
) {
    await host.createDirectory(promptPath(null))

    const n = options?.name || t.id
    let fn = promptPath(n)

    if (options.fork) {
        let suff = 2
        for (;;) {
            fn = promptPath(n + "_" + suff)
            if (await fileExists(fn)) {
                suff++
                continue
            }
            break
        }
    }

    if (await fileExists(fn)) throw new Error(`file ${fn} already exists`)

    await writeText(fn, t.jsSource)

    return fn
}
