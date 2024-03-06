import { MarkdownTrace, highlightsLanguages, host } from "genaiscript-core"

const EXT_MAP: Record<string, string> = {
    js: "javascript",
    mjs: "javascript",
    cs: "c_sharp",
    sh: "bash",
    py: "python",
    rs: "rust",
    ts: "typescript",
}

export function isHighlightSupported(f: string) {
    if (!f) return false
    const ext = host.path.extname(f).slice(1).toLowerCase()
    return ext && highlightsLanguages.includes(EXT_MAP[ext] || ext)
}

export async function outline(
    files: LinkedFile[],
    options?: { trace?: MarkdownTrace }
) {
    const { trace } = options || {}
    const service = host.highlight
    await service.init(trace)

    const codeFiles = files.filter(
        ({ filename, content }) => !!content && isHighlightSupported(filename)
    )
    trace?.item(
        `supported files: ${codeFiles.map(({ filename }) => filename).join(", ")}`
    )
    return await service.outline(codeFiles)
}
