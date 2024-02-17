import { host } from "genaiscript-core"

export async function highlight(
    files: LinkedFile[],
    options: HighlightOptions
) {
    const codeFiles = files.filter(({ content }) => !!content)
    const service = host.highlight
    return await service.highlight(codeFiles, options)
}

export async function outline(files: LinkedFile[]) {
    const codeFiles = files.filter(({ content }) => !!content)
    const service = host.highlight
    return await service.outline(codeFiles)
}
