import { grepSearch } from "../../core/src/grep"

export async function grep(pattern: string, files: string[]) {
    const res = await grepSearch(pattern, files)
    console.log(res.files.map((f) => f.filename).join("\n"))
}
