import { unzipSync } from "fflate"
import { minimatch } from "minimatch"
import { lookupMime } from "./mime"
import { isBinaryMimeType } from "./parser"
import { host } from "./host"

export async function unzip(
    data: Uint8Array,
    options?: ParseZipOptions
): Promise<WorkspaceFile[]> {
    const { glob } = options || {}
    const res = unzipSync(data, {
        filter: (file: { name: string; originalSize: number }) => {
            if (glob)
                return minimatch(file.name, glob, {
                    windowsPathsNoEscape: true,
                })
            return true
        },
    })
    const decoder = host.createUTF8Decoder()
    return Object.entries(res).map(([filename, data]) => {
        const mime = lookupMime(filename)
        if (isBinaryMimeType(mime))
            return <WorkspaceFile>{ filename } // TODO bytes support
        else return <WorkspaceFile>{ filename, content: decoder.decode(data) }
    })
}
