import { YAMLStringify, treeSitterQuery } from "genaiscript-core"

export async function codeQuery(file: string, query: string) {
    const res = await treeSitterQuery(
        { filename: file, label: "", content: undefined },
        query
    )
    console.log(YAMLStringify(res))
}
