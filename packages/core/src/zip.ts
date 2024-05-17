import { unzipSync } from "fflate"
import { minimatch } from "minimatch"

export async function unzip(data: Uint8Array, options?: ParseZipOptions) {
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
    return res
}
