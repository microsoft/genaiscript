import { HTTPS_REGEX } from "./constants"
import { host } from "./host"
import { unique, utf8Decode, utf8Encode } from "./util"

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

export async function fileExists(fn: string) {
    try {
        await host.readFile(fn)
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

export async function expandFiles(files: string[], excludedFiles?: string[]) {
    const urls = files
        .filter((f) => HTTPS_REGEX.test(f))
        .filter((f) => !excludedFiles?.includes(f))
    const others = await host.findFiles(
        files.filter((f) => !HTTPS_REGEX.test(f)),
        { ignore: excludedFiles?.filter((f) => !HTTPS_REGEX.test(f)) }
    )
    return unique([...urls, ...others])
}

export function filePathOrUrlToWorkspaceFile(f: string) {
    return HTTPS_REGEX.test(f) || host.path.resolve(f) === f ? f : `./${f}`
}
