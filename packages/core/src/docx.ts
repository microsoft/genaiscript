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
        trace?.error(`mammoth not found, installing ${MAMMOTH_VERSION}...`)
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
    file: string,
    options?: { trace: MarkdownTrace }
): Promise<string> {
    const { trace } = options || {}
    try {
        const mammoth = await tryImportMammoth(trace)
        const path = !/^\//.test(file)
            ? host.path.join(host.projectFolder(), file)
            : file
        const results = await mammoth.extractRawText({ path })
        return results.value
    } catch (error) {
        logError(error.message)
        trace?.error(`reading docx`, error)
        return undefined
    }
}
