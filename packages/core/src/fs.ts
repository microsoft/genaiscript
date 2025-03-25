import debug from "debug"
const dbg = debug("genaiscript:fs")

import { lstat, mkdir, writeFile } from "fs/promises"
import { HTTPS_REGEX } from "./constants"
import { host } from "./host"
import { readFile } from "fs/promises"
import { dirname } from "path"

/**
 * Changes the file extension of the given filename to a new extension.
 * If the new extension does not start with a dot, a dot is prepended.
 * The function replaces the existing extension in the filename.
 * 
 * @param filename - The name of the file whose extension is to be changed.
 * @param newext - The new extension to be assigned to the file.
 * @returns The filename with the updated extension.
 */
export function changeext(filename: string, newext: string) {
    dbg(`checking if newext starts with a dot`)
    if (!newext.startsWith(".")) {
        newext = "." + newext
    }
    return filename.replace(/\.[^.]+$/, newext)
}

/**
 * Reads the content of a text file.
 *
 * This function reads the contents of a specified file and returns it as a string. 
 * It uses UTF-8 encoding to ensure proper handling of text data.
 *
 * @param fn - The path to the file to be read.
 * @returns The content of the file as a string.
 */
export async function readText(fn: string) {
    dbg(`reading file ${fn}`)
    return readFile(fn, { encoding: "utf8" })
}

/**
 * Attempts to read the content of a specified text file.
 * If successful, returns the content as a string.
 * If the file cannot be read, returns undefined.
 *
 * @param fn - The path to the file to be read.
 */
export async function tryReadText(fn: string) {
    try {
        dbg(`trying to read text from file ${fn}`)
        return await readText(fn)
    } catch {
        return undefined
    }
}

/**
 * Ensures that the specified directory exists. If it does not exist, it will be created recursively.
 * 
 * @param dir - The path of the directory to be ensured.
 */
export async function ensureDir(dir: string) {
    dbg(`ensuring directory exists ${dir}`)
    await mkdir(dir, { recursive: true })
}

/**
 * Writes the specified text content to a file.
 * Ensures that the directory for the file exists by creating it if necessary.
 *
 * @param fn - The path of the file to write the content to.
 * @param content - The text content to be written to the file.
 */
export async function writeText(fn: string, content: string) {
    dbg(`writing text to file ${fn}`)
    await mkdir(dirname(fn), { recursive: true })
    await writeFile(fn, content, { encoding: "utf8" })
}

/**
 * Checks if a file exists at the specified path.
 *
 * This function attempts to retrieve the file statistics using `tryStat`. 
 * If the statistics indicate that the specified path is a file, it returns true; 
 * otherwise, it returns false.
 *
 * @param fn - The path of the file to check.
 * @returns A boolean indicating whether the file exists.
 */
export async function fileExists(fn: string) {
    dbg(`checking if file exists ${fn}`)
    const stat = await tryStat(fn)
    return !!stat?.isFile()
}

/**
 * Attempts to retrieve the file statistics for a specified file.
 * If the file does not exist or an error occurs during the retrieval,
 * it returns undefined. This function is useful for checking the
 * existence of a file and gathering relevant metadata.
 * 
 * @param fn - The file path for which to get statistics.
 * @returns The file statistics or undefined if not found.
 */
export async function tryStat(fn: string) {
    try {
        dbg(`getting file stats for ${fn}`)
        return await lstat(fn)
    } catch {
        return undefined
    }
}

/**
 * Reads JSON data from a specified file.
 * Utilizes file reading function to retrieve the content and parses it as JSON.
 * In case of an error during reading or parsing, an exception will be thrown.
 * 
 * @param fn - The path of the file to read the JSON from.
 * @returns The parsed JSON object.
 */
export async function readJSON(fn: string) {
    dbg(`reading JSON from file ${fn}`)
    return JSON.parse(await readText(fn))
}

/**
 * Attempts to read and parse JSON content from a specified file.
 * Returns the parsed JSON object if successful; otherwise, returns undefined.
 * Logs debug information during the operation.
 * 
 * @param fn - The file name from which to read the JSON.
 */
export async function tryReadJSON(fn: string) {
    try {
        dbg(`trying to read JSON from file ${fn}`)
        return JSON.parse(await readText(fn))
    } catch {
        return undefined
    }
}

/**
 * Writes a JSON object to a specified file.
 * Converts the object to a JSON string and saves it with UTF-8 encoding.
 * Ensures that the directory structure for the file exists before writing.
 *
 * @param fn - The path of the file where the JSON should be written.
 * @param obj - The JSON object to write to the file.
 */
export async function writeJSON(fn: string, obj: any) {
    dbg(`writing JSON to file ${fn}`)
    await writeText(fn, JSON.stringify(obj))
}

/**
 * Expands a list of file paths or URLs based on specified options.
 * Filters the input files to separate URLs from local files, finds additional files, 
 * and applies an optional extension acceptance filter.
 *
 * @param files - An array of file paths or URLs to expand.
 * @param options - Options for controlling the behavior of expansion.
 * @param options.excludedFiles - List of files to exclude from the result.
 * @param options.accept - A comma-separated list of accepted file extensions. 
 *                         If provided, only files with these extensions will be included.
 * @param options.applyGitIgnore - A flag indicating whether to apply .gitignore rules when finding files.
 * 
 * @returns An array of files that match the specified criteria.
 */
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

/**
 * Expands the given array of file paths or workspace files.
 * Filters out non-string entries and expands valid file paths using
 * the expandFiles function. Combines the results with existing 
 * workspace files and returns a unified array of WorkspaceFile objects.
 *
 * @param files - Array of file paths and/or workspace files.
 * @returns An array of WorkspaceFile objects.
 */
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

/**
 * Converts a file path or URL to a workspace file format.
 * If the input is a valid HTTPS URL or an absolute file path, it returns the input as is.
 * Otherwise, it prefixes the input with './' to indicate a relative path.
 *
 * @param f - The file path or URL to be converted.
 * @returns The converted workspace file format.
 */
export function filePathOrUrlToWorkspaceFile(f: string) {
    dbg(`converting file path or URL to workspace file ${f}`)
    return HTTPS_REGEX.test(f) || host.path.resolve(f) === f ? f : `./${f}`
}
