import { host } from "./host"
import { HTMLToMarkdown } from "./html"
import { TraceOptions } from "./trace"
import { logError } from "./util"

/**
 * parses docx, require mammoth to be installed
 * @param fileOrUrl
 * @param content
 * @returns
 */
export async function DOCXTryParse(
    file: string,
    options?: TraceOptions & { format?: "markdown" | "html" | "text" }
): Promise<string> {
    const { trace, format = "markdown" } = options || {}
    try {
        const { extractRawText, convertToHtml } = await import("mammoth")
        const path = !/^\//.test(file)
            ? host.path.join(host.projectFolder(), file)
            : file
        if (format === "html" || format === "markdown") {
            const results = await convertToHtml({ path })
            if (format === "markdown")
                return HTMLToMarkdown(results.value, {
                    trace,
                    disableGfm: true,
                })
            return results.value
        } else {
            const results = await extractRawText({ path })
            return results.value
        }
    } catch (error) {
        logError(error)
        trace?.error(`reading docx`, error)
        return undefined
    }
}
