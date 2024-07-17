import { resolveFileContent } from "../../core/src/file"
import { treeSitterQuery } from "../../core/src/treesitter"

export async function codeQuery(file: string, query: string) {
    const f: WorkspaceFile = { filename: file, content: undefined }
    await resolveFileContent(f)
    const res = await treeSitterQuery(f, query)
    const captures = res
        .map(({ name, node }) => `;;; ${name}\n${node.toString()}`)
        .join("\n")

    console.log(captures)
}
