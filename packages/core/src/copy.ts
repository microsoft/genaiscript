import { PromptTemplate } from "./ast"
import { host } from "./host"
import { fileExists, writeText } from "./util"

function promptPath(id: string) {
    const prompts = host.resolvePath(host.projectFolder(), "prompts")
    if (id === null) return prompts
    return host.resolvePath(prompts, id + ".prompt.js")
}
export async function copyPrompt(
    t: PromptTemplate,
    options: { fork: boolean; name?: string }
) {
    await host.createDirectory(promptPath(null))

    let fn = promptPath(options?.name || t.id)

    if (options.fork) {
        let suff = 2
        for (;;) {
            fn = promptPath(t.id + "_" + suff)
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
