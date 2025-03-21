import { lstat, mkdir, writeFile } from "fs/promises"
import { HTTPS_REGEX } from "./constants"
import { host } from "./host"
import { readFile } from "fs/promises"
import { dirname } from "path"

export function changeext(filename: string, newext: string) {
    if (!newext.startsWith(".")) newext = "." + newext
    return filename.replace(/\.[^.]+$/, newext)
}

export async function readText(fn: string) {
    return readFile(fn, { encoding: "utf8" })
}

export async function tryReadText(fn: string) {
    try {
        return await readText(fn)
    } catch {
        return undefined
    }
}

export async function writeText(fn: string, content: string) {
    await mkdir(dirname(fn), { recursive: true })
    await writeFile(fn, content, { encoding: "utf8" })
}

export async function fileExists(fn: string) {
    const stat = await tryStat(fn)
    return !!stat?.isFile()
}

export async function tryStat(fn: string) {
    try {
        return await lstat(fn)
    } catch {
        return undefined
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
    const { excludedFiles = [], accept, applyGitIgnore } = options || {}
    if (!files.length || accept === "none") return []

    const urls = files
        .filter((f) => HTTPS_REGEX.test(f))
        .filter((f) => !excludedFiles.includes(f))
    const others = await host.findFiles(
        files.filter((f) => !HTTPS_REGEX.test(f)),
        {
            ignore: excludedFiles.filter((f) => !HTTPS_REGEX.test(f)),
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
