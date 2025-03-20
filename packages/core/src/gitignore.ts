// Import the 'ignore' library to handle .gitignore file parsing and filtering
import ignorer from "ignore"
import { tryReadText, writeText } from "./fs"
import { GIT_IGNORE, GIT_IGNORE_GENAI } from "./constants"
import { host } from "./host"
import { logVerbose } from "./util"

export type GitIgnorer = (files: string[]) => string[]

export async function createGitIgnorer(): Promise<GitIgnorer> {
    const gitignores = [
        await tryReadText(GIT_IGNORE),
        await tryReadText(GIT_IGNORE_GENAI),
    ].filter((g) => !!g)
    if (!gitignores.length) return (f) => f

    // Create an ignorer instance and add the .gitignore patterns to it
    const ig = ignorer({ allowRelativePaths: true })
    for (const gitignore of gitignores) ig.add(gitignore)
    return (files: readonly string[]) => ig.filter(files)
}

/**
 * Filters a list of files based on the patterns specified in a .gitignore string.
 * Utilizes the 'ignore' library to determine which files should be excluded.
 *
 * @param gitignore - The content of a .gitignore file as a string.
 * If this is empty or null, no filtering occurs.
 * @param files - An array of file paths to be filtered.
 * @returns An array of files that are not ignored according to the .gitignore patterns.
 */
export async function filterGitIgnore(files: string[]) {
    const ignorer = await createGitIgnorer()
    return ignorer(files)
}

export async function gitIgnoreEnsure(dir: string, entries: string[]) {
    const fn = host.path.join(dir, GIT_IGNORE)
    let src = (await tryReadText(fn)) || ""
    const oldsrc = src
    const newline = /\r\n/.test(src) ? "\r\n" : "\n"
    const lines = src.split(/\r?\n/g)
    for (const entry of entries) {
        if (!lines.some((l) => l.startsWith(entry))) {
            if (src) src += newline
            src += entry
        }
    }
    if (oldsrc !== src) {
        logVerbose(`updating ${fn}`)
        await writeText(fn, src)
    }
}
