import { resolveFileContent } from "../../core/src/file"
import {
    serializeQueryCapture,
    treeSitterQuery,
} from "../../core/src/treesitter"
import { YAMLStringify } from "../../core/src/yaml"
import { host } from "../../core/src/host"
import { logVerbose } from "../../core/src/util"

export async function codeQuery(files: string, query: string) {
    const ffs = await host.findFiles(files, {
        applyGitIgnore: true,
    })
    const captures: any[] = []

    for (const filename of ffs) {
        logVerbose(`scanning ${filename}`)
        const f: WorkspaceFile = { filename, content: undefined }
        await resolveFileContent(f)
        if (!f.content) continue
        const res = await treeSitterQuery(f, query)
        captures.push(...res.map((r) => serializeQueryCapture(f.filename, r)))
    }

    console.log(YAMLStringify(captures))
}
