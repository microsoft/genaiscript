import {
    HIGHLIGHT_LENGTH,
    HighlightResponse,
    HighlightService,
    Host,
    MarkdownTrace,
    PromiseType,
    installImport,
} from "genaiscript-core"
import type { ILLMContextSizer } from "llm-code-highlighter"

async function tryImportLLMCodeHighlighter(trace: MarkdownTrace) {
    try {
        const m = await import("llm-code-highlighter")
        return m
    } catch (e) {
        trace?.error("llamaindex not found, installing...")
        await installImport("llm-code-highlighter", trace)
        const m = await import("llm-code-highlighter")
        return m
    }
}

class NumCharSizer implements ILLMContextSizer {
    constructor(readonly length: number) {}
    fits(content: string): boolean {
        return content.length < this.length
    }
}

export class LLMCodeHighlighterService implements HighlightService {
    private module: PromiseType<ReturnType<typeof tryImportLLMCodeHighlighter>>

    constructor(readonly host: Host) {}

    async init(trace?: MarkdownTrace) {
        if (this.module) return

        this.module = await tryImportLLMCodeHighlighter(trace)
    }

    async highlight(
        files: LinkedFile[],
        options?: HighlightOptions
    ): Promise<HighlightResponse> {
        const { maxLength = HIGHLIGHT_LENGTH } = options || {}
        const { getHighlightsThatFit } = this.module
        const sizer = new NumCharSizer(maxLength)
        const sources = files.map(({ filename, content }) => ({
            relPath: filename,
            code: content,
        }))
        const response = await getHighlightsThatFit(sizer, [],sources)
        return <HighlightResponse>{
            ok: true,
            response,
        }
    }

    async outline(files: LinkedFile[]): Promise<HighlightResponse> {
        const { getFileOutlineHighlights } = this.module
        const req = files.map(({ filename, content }) => ({
            relPath: filename,
            code: content,
        }))
        console.log(JSON.stringify(req, null, 2))
        const response = await getFileOutlineHighlights(req)
        return <HighlightResponse>{
            ok: true,
            response,
        }
    }
}
