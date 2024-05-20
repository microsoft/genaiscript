import { host } from "./host"
import { TraceOptions } from "./trace"
import { logError } from "./util"
import { extractRawText } from "mammoth"

/**
 * parses docx, require mammoth to be installed
 * @param fileOrUrl
 * @param content
 * @returns
 */
export async function DOCXTryParse(
    file: string,
    options?: TraceOptions
): Promise<string> {
    const { trace } = options || {}
    try {
        const path = !/^\//.test(file)
            ? host.path.join(host.projectFolder(), file)
            : file
        const results = await extractRawText({ path })
        return results.value
    } catch (error) {
        trace?.error(`reading docx`, error)
        return undefined
    }
}
