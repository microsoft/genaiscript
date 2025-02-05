import { host } from "./host"
import { TraceOptions } from "./trace"

/**
 * parses docx, require mammoth to be installed
 * @param fileOrUrl
 * @param content
 * @returns
 */
export async function DOCXTryParse(
    file: string,
    options?: TraceOptions & { format: "html" | "text" }
): Promise<string> {
    const { trace, format = "text" } = options || {}
    try {
        const { extractRawText, convertToHtml } = await import("mammoth")
        const path = !/^\//.test(file)
            ? host.path.join(host.projectFolder(), file)
            : file
        if (format === "html") {
            const results = await convertToHtml({ path })
            return results.value
        } else {
            const results = await extractRawText({ path })
            return results.value
        }
    } catch (error) {
        trace?.error(`reading docx`, error)
        return undefined
    }
}
