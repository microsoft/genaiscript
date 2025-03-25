import { unzipSync } from "fflate"
import { lookupMime } from "./mime"
import { isBinaryMimeType } from "./binary"
import { host } from "./host"
import { isGlobMatch } from "./glob"
import { toBase64 } from "./base64"

/**
 * Unzips a given Uint8Array of compressed data and returns an array of WorkspaceFile objects.
 * 
 * @param data - The compressed data in Uint8Array format.
 * @param options - Optional parameters for parsing, including a glob pattern to filter files.
 * 
 * @returns An array of WorkspaceFile objects, each representing a file extracted from the zip.
 *          Binary files are encoded in base64, while text files are decoded to UTF-8.
 */
export async function unzip(
    data: Uint8Array,
    options?: ParseZipOptions
): Promise<WorkspaceFile[]> {
    const { glob } = options || {}
    if (!data) return []
    const res = unzipSync(data, {
        filter: (file: { name: string; originalSize: number }) => {
            if (glob) return isGlobMatch(file.name, glob)
            return true
        },
    })
    const decoder = host.createUTF8Decoder()
    return Object.entries(res).map(([filename, data]) => {
        const mime = lookupMime(filename)
        if (isBinaryMimeType(mime))
            return <WorkspaceFile>{
                filename,
                encoding: "base64",
                content: toBase64(data),
            } // bytes support
        else return <WorkspaceFile>{ filename, content: decoder.decode(data) }
    })
}
