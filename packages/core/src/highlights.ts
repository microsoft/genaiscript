import { highlightsLanguages, host } from "genaiscript-core"

function isSupported(f: string) {
    const ext = host.path.extname(f).slice(1).toLowerCase()
    const map: Record<string, string> = {
        js: "javascript",
        cs: "c_sharp",
        sh: "bash",
        py: "python",
        rs: "rust",
        ts: "typescript",
    }
    return ext && highlightsLanguages.includes(map[ext] || ext)
}

/*
export const highlightsLanguages: string[] = ["bash","c","c_sharp","cpp","css","elisp","elixir","elm","embedded_template","go","html","java","javascript","json","lua","ocaml","php","python","ql","rescript","ruby","rust","systemrdl","toml","tsx","typescript","vue","yaml"];
*/

export async function highlight(
    files: LinkedFile[],
    options: HighlightOptions
) {
    const codeFiles = files.filter(
        ({ filename, content }) => !!content && isSupported(filename)
    )
    const service = host.highlight
    return await service.highlight(codeFiles, options)
}

export async function outline(files: LinkedFile[]) {
    const codeFiles = files.filter(
        ({ filename, content }) => !!content && isSupported(filename)
    )
    const service = host.highlight
    return await service.outline(codeFiles)
}
