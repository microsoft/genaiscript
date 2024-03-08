import { host } from "./host"
import { MarkdownTrace } from "./trace"
import { installImport } from "./import"
import { logError } from "./util"
import { MAMMOTH_VERSION } from "./version"

async function tryImportMammoth(trace?: MarkdownTrace) {
    try {
        const mod = await import("mammoth")
        return mod
    } catch (e) {
        trace?.error(
            `mammoth not found, installing ${MAMMOTH_VERSION}...`
        )
        try {
            await installImport("mammoth", MAMMOTH_VERSION, trace)
            const mod = await import("mammoth")
            return mod
        } catch (e) {
            trace?.error("mammoth failed to load")
            return undefined
        }
    }
}

/**
 * parses docx, require mammoth to be installed
 * @param fileOrUrl
 * @param content
 * @returns
 */
export async function DOCXTryParse(
    fileOrUrl: string,
    content?: Uint8Array,
    options?: { trace: MarkdownTrace; disableCleanup?: boolean }
): Promise<string> {
    const { trace, disableCleanup } = options || {}
    try {
        const mammoth = await tryImportMammoth(trace)
        const data = content || (await host.readFile(fileOrUrl))
        const results = await mammoth.extractRawText({ arrayBuffer: data.buffer })
        return results.value
    } catch (error) {
        logError(error.message)
        return undefined
    }
}
