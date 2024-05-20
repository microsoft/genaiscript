import { DOT_ENV_REGEX, HTTPS_REGEX } from "./constants"
import { NotSupportedError, errorMessage } from "./error"
import { resolveFileContent } from "./file"
import { ReadFileOptions, host } from "./host"
import { logVerbose, utf8Decode, utf8Encode } from "./util"

export async function readText(fn: string) {
    const curr = await host.readFile(fn)
    return utf8Decode(curr)
}

export async function tryReadText(fn: string) {
    try {
        return await readText(fn)
    } catch {
        return undefined
    }
}

export async function writeText(fn: string, content: string) {
    await host.writeFile(fn, utf8Encode(content))
}

export async function fileExists(fn: string, options?: ReadFileOptions) {
    try {
        await host.readFile(fn, options)
        return true
    } catch {
        return false
    }
}

export async function readJSON(fn: string) {
    return JSON.parse(await readText(fn))
}

export async function tryReadJSON(fn: string) {
    try {
        return JSON.parse(await readText(fn))
    } catch {
        return undefined
    }
}

export async function writeJSON(fn: string, obj: any) {
    await writeText(fn, JSON.stringify(obj))
}

export function filenameOrFileToContent(
    fileOrContent: string | WorkspaceFile
): string {
    return typeof fileOrContent === "string"
        ? fileOrContent
        : fileOrContent?.content
}

export function createFileSystem(): WorkspaceFileSystem {
    const fs: WorkspaceFileSystem = {
        findFiles: async (glob, options) => {
            const { readText } = options || {}
            const names = (await host.findFiles(glob)).filter(
                (f) => !DOT_ENV_REGEX.test(f)
            )
            const files: WorkspaceFile[] = []
            for (const name of names) {
                const file =
                    readText === false
                        ? <WorkspaceFile>{
                              filename: name,
                              content: undefined,
                          }
                        : await fs.readText(name)
                files.push(file)
            }
            return files
        },
        writeText: async (filename: string, c: string) => {
            if (DOT_ENV_REGEX.test(filename))
                throw new Error("writing .env not allowed")
            
            host.workspace.writeText(filename, c)
        },
        readText: async (f: string | WorkspaceFile) => {
            if (f === undefined)
                throw new NotSupportedError("missing file name")

            const file: WorkspaceFile =
                typeof f === "string"
                    ? {
                          filename: f,
                          content: undefined,
                      }
                    : f
            if (DOT_ENV_REGEX.test(file.filename)) return file
            try {
                await resolveFileContent(file)
            } catch (e) {
                logVerbose(
                    `error reading file ${file.filename}: ${errorMessage(e)}`
                )
            }
            return file
        },
    }
    ;(fs as any).readFile = readText
    return Object.freeze(fs)
}

export async function expandFiles(files: string[], excludedFiles?: string[]) {
    const res = new Set<string>()
    for (const file of files) {
        const fs = await host.findFiles(file)
        for (const f of fs) res.add(f)
    }

    if (excludedFiles?.length) {
        for (const arg of excludedFiles) {
            const ffs = await host.findFiles(arg)
            for (const f of ffs) {
                res.delete(f)
            }
        }
    }

    return Array.from(res.values())
}

export function filePathOrUrlToWorkspaceFile(f: string) {
    return HTTPS_REGEX.test(f) || host.path.resolve(f) === f ? f : `./${f}`
}
