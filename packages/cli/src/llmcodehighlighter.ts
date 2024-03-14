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
import { LLM_CODE_HIGHLIGHTER_VERSION } from "./version"

async function tryImportLLMCodeHighlighter(trace: MarkdownTrace) {
    try {
        const m = await import("llm-code-highlighter")
        return m
    } catch (e) {
        trace?.error(
            `llm-code-highlighter not found, installing ${LLM_CODE_HIGHLIGHTER_VERSION}...`
        )
        await installImport(
            "llm-code-highlighter",
            LLM_CODE_HIGHLIGHTER_VERSION,
            trace
        )
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

    async outline(files: LinkedFile[]): Promise<HighlightResponse> {
        const { getOutlines } = this.module
        const req = files.map(({ filename, content }) => ({
            relPath: filename,
            code: content,
        }))

        try {
            const response = await getOutlines(req)
            return <HighlightResponse>{
                ok: true,
                response,
            }
        } catch (error) {
            return { ok: false, error, response: "" }
        }
    }
}
