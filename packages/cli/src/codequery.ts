import { treeSitterQuery } from "../../core/src/treesitter"

export async function codeQuery(file: string, query: string) {
    const res = await treeSitterQuery(
        { filename: file, content: undefined },
        query
    )
    const captures = res
        .map(({ name, node }) => `;;; ${name}\n${node.toString()}`)
        .join("\n")

    console.log(captures)
}
