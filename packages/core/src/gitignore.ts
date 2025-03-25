import debug from "debug"
const dbg = debug("genaiscript:gitignore")

// Import the 'ignore' library to handle .gitignore file parsing and filtering
import ignorer from "ignore"
import { tryReadText, writeText } from "./fs"
import { GENAISCRIPTIGNORE, GIT_IGNORE, GIT_IGNORE_GENAI } from "./constants"
import { host } from "./host"
import { logVerbose } from "./util"

export type GitIgnorer = (files: string[]) => string[]

/**
 * Creates a Git ignorer function that filters files based on patterns from specified .gitignore files.
 * It reads the contents of the .gitignore files, initializes an ignorer instance, and adds the patterns to it.
 * If no .gitignore files are found, a function that returns the original file list is returned.
 *
 * @returns A function that accepts an array of file paths and returns a filtered array excluding ignored files.
 */
export async function createGitIgnorer(): Promise<GitIgnorer> {
    const gitignores = [
        await tryReadText(GIT_IGNORE),
        await tryReadText(GIT_IGNORE_GENAI),
        await tryReadText(GENAISCRIPTIGNORE),
    ].filter((g) => !!g)
    if (!gitignores.length) {
        dbg("no gitignore files found")
        return (f) => f
    }

    // Create an ignorer instance and add the .gitignore patterns to it
    dbg("creating ignorer instance")
    const ig = ignorer({ allowRelativePaths: true })
    for (const gitignore of gitignores) {
        ig.add(gitignore)
    }
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
    dbg("creating git ignorer")
    const ignorer = await createGitIgnorer()
    return ignorer(files)
}

/**
 * Ensures that specified entries are present in the .gitignore file.
 * Reads the current content of the .gitignore file, adds any missing entries,
 * and writes the updated content back to the file.
 *
 * @param dir - The directory containing the .gitignore file.
 * @param entries - An array of entries to ensure are included in the .gitignore.
 * Checks each entry against the current contents of the .gitignore file
 * and appends it if it is not already present.
 */
export async function gitIgnoreEnsure(dir: string, entries: string[]) {
    const fn = host.path.join(dir, GIT_IGNORE)
    dbg(`reading file ${fn}`)
    let src = (await tryReadText(fn)) || ""
    const oldsrc = src
    const newline = /\r\n/.test(src) ? "\r\n" : "\n"
    const lines = src.split(/\r?\n/g)
    for (const entry of entries) {
        dbg(`checking entry ${entry} in lines`)
        if (!lines.some((l) => l.startsWith(entry))) {
            if (src) {
                src += newline
            }
            src += entry
        }
    }
    if (oldsrc !== src) {
        logVerbose(`updating ${fn}`)
        await writeText(fn, src)
    }
}
