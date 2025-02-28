import { join } from "node:path"
import { PDF_HASH_LENGTH } from "./constants"
import { hash } from "./crypto"
import { host } from "./host"
import { HTMLToMarkdown } from "./html"
import { TraceOptions } from "./trace"
import { dotGenaiscriptPath, logError, logVerbose } from "./util"
import { readFile, writeFile } from "node:fs/promises"
import { YAMLStringify } from "./yaml"
import { serializeError } from "./error"

async function computeHashFolder(
    filename: string | WorkspaceFile,
    content: Uint8Array,
    options: TraceOptions & DocxParseOptions
) {
    const { trace, ...rest } = options
    const h = await hash(
        [typeof filename === "string" ? { filename } : filename, content, rest],
        {
            readWorkspaceFiles: true,
            version: true,
            length: PDF_HASH_LENGTH,
        }
    )
    return dotGenaiscriptPath("cache", "docx", h)
}

/**
 * parses docx, require mammoth to be installed
 */
export async function DOCXTryParse(
    filename: string,
    content?: Uint8Array,
    options?: TraceOptions & DocxParseOptions
): Promise<{ content?: string; error?: SerializedError }> {
    const { trace, cache, format = "markdown" } = options || {}

    const folder = await computeHashFolder(filename, content, options)
    const resFilename = join(folder, "res.json")
    const readCache = async () => {
        if (cache === false) return undefined
        try {
            const res = JSON.parse(
                await readFile(resFilename, {
                    encoding: "utf-8",
                })
            )
            logVerbose(`docx: cache hit at ${folder}`)
            return res
        } catch {
            return undefined
        }
    }

    {
        // try cache hit
        const cached = await readCache()
        if (cached) return cached
    }

    try {
        const { extractRawText, convertToHtml } = await import("mammoth")
        const input = content
            ? { buffer: Buffer.from(content) }
            : { path: host.resolvePath(filename) }

        let text: string
        if (format === "html" || format === "markdown") {
            const results = await convertToHtml(input)
            if (format === "markdown")
                text = await HTMLToMarkdown(results.value, {
                    trace,
                    disableGfm: true,
                })
            else text = results.value
        } else {
            const results = await extractRawText(input)
            text = results.value
        }

        await writeFile(join(folder, "content.txt"), text)
        const res = { content: text }
        await writeFile(resFilename, JSON.stringify(res))

        return res
    } catch (error) {
        logVerbose(error)
        {
            // try cache hit
            const cached = await readCache()
            if (cached) return cached
        }
        trace?.error(`reading pdf`, error) // Log error if tracing is enabled
        await writeFile(
            join(folder, "error.txt"),
            YAMLStringify(serializeError(error))
        )
        return { error: serializeError(error) }
    }
}
