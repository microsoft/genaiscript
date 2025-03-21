import debug from "debug"
const dbg = debug("genai:fs")

import { lstat, mkdir, writeFile } from "fs/promises"
import { HTTPS_REGEX } from "./constants"
import { host } from "./host"
import { readFile } from "fs/promises"
import { dirname } from "path"

export function changeext(filename: string, newext: string) {
    dbg(`checking if newext starts with a dot`)
    if (!newext.startsWith(".")) {
        newext = "." + newext
    }
    return filename.replace(/\.[^.]+$/, newext)
}

export async function readText(fn: string) {
    dbg(`reading file ${fn}`)
    return readFile(fn, { encoding: "utf8" })
}

export async function tryReadText(fn: string) {
    try {
        dbg(`trying to read text from file ${fn}`)
        return await readText(fn)
    } catch {
        return undefined
    }
}

export async function writeText(fn: string, content: string) {
    await mkdir(dirname(fn), { recursive: true })
    dbg(`writing text to file ${fn}`)
    await writeFile(fn, content, { encoding: "utf8" })
}

export async function fileExists(fn: string) {
    dbg(`checking if file exists ${fn}`)
    const stat = await tryStat(fn)
    return !!stat?.isFile()
}

export async function tryStat(fn: string) {
    try {
        dbg(`getting file stats for ${fn}`)
        return await lstat(fn)
    } catch {
        return undefined
    }
}

export async function readJSON(fn: string) {
    dbg(`reading JSON from file ${fn}`)
    return JSON.parse(await readText(fn))
}

export async function tryReadJSON(fn: string) {
    try {
        dbg(`trying to read JSON from file ${fn}`)
        return JSON.parse(await readText(fn))
    } catch {
        return undefined
    }
}

export async function writeJSON(fn: string, obj: any) {
    dbg(`writing JSON to file ${fn}`)
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
    dbg(`no files to expand or accept is none`)
    if (!files.length || accept === "none") {
        return []
    }

    dbg(`filtering URLs from files`)
    const urls = files
        .filter((f) => HTTPS_REGEX.test(f))
        .filter((f) => !excludedFiles.includes(f))
    dbg(`finding other files`)
    const others = await host.findFiles(
        files.filter((f) => !HTTPS_REGEX.test(f)),
        {
            ignore: excludedFiles.filter((f) => !HTTPS_REGEX.test(f)),
            applyGitIgnore,
        }
    )

    const res = new Set([...urls, ...others])
    dbg(`applying accept filter`)
    if (accept) {
        const exts = accept
            .split(",")
            .map((s) => s.trim().replace(/^\*\./, "."))
            .filter((s) => !!s)
        for (const rf of res) {
            dbg(`removing file ${rf} as it does not match accepted extensions`)
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
    dbg(`expanding file or workspace files`)
    const filesPaths = await expandFiles(
        files.filter((f) => typeof f === "string"),
        {
            applyGitIgnore: false,
        }
    )
    dbg(`filtering workspace files`)
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
    dbg(`converting file path or URL to workspace file ${f}`)
    return HTTPS_REGEX.test(f) || host.path.resolve(f) === f ? f : `./${f}`
}
