import { HTTPS_REGEX } from "./constants"
import { host } from "./host"
import { utf8Decode, utf8Encode } from "./util"

export function changeext(filename: string, newext: string) {
    if (!newext.startsWith(".")) newext = "." + newext
    return filename.replace(/\.[^.]+$/, newext)
}

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
        return (await host.readFile(fn)) !== undefined
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

export async function expandFiles(
    files: string[],
    options?: {
        excludedFiles?: string[]
        accept?: string
        applyGitIgnore?: boolean
    }
) {
    if (!files.length) return []

    const { excludedFiles, accept, applyGitIgnore } = options || {}
    const urls = files
        .filter((f) => HTTPS_REGEX.test(f))
        .filter((f) => !excludedFiles?.includes(f))
    const others = await host.findFiles(
        files.filter((f) => !HTTPS_REGEX.test(f)),
        {
            ignore: excludedFiles?.filter((f) => !HTTPS_REGEX.test(f)),
            applyGitIgnore,
        }
    )

    const res = new Set([...urls, ...others])
    if (accept) {
        const exts = accept
            .split(",")
            .map((s) => s.trim().replace(/^\*\./, "."))
            .filter((s) => !!s)
        for (const rf of res) {
            if (!exts.some((ext) => rf.endsWith(ext))) {
                res.delete(rf)
            }
        }
    }
    return Array.from(res)
}

export async function expandFileOrWorkspaceFiles(
    files: (string | WorkspaceFile)[]
): Promise<WorkspaceFile[]> {
    const filesPaths = await expandFiles(
        files.filter((f) => typeof f === "string"),
        {
            applyGitIgnore: false,
        }
    )
    const workspaceFiles = files.filter(
        (f) => typeof f === "object"
    ) as WorkspaceFile[]
    return [
        ...filesPaths.map(
            (filename) =>
                ({
                    filename,
                }) satisfies WorkspaceFile
        ),
        ...workspaceFiles,
    ]
}

export function filePathOrUrlToWorkspaceFile(f: string) {
    return HTTPS_REGEX.test(f) || host.path.resolve(f) === f ? f : `./${f}`
}
