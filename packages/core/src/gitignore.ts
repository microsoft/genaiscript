// Import the 'ignore' library to handle .gitignore file parsing and filtering
import ignorer from "ignore"
import { tryReadText } from "./fs"
import { GIT_IGNORE, GIT_IGNORE_GENAI } from "./constants"

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
    const gitignores = [
        await tryReadText(GIT_IGNORE),
        await tryReadText(GIT_IGNORE_GENAI),
    ].filter((g) => !!g)
    if (gitignores.length) {
        // Create an ignorer instance and add the .gitignore patterns to it
        const ig = ignorer({ allowRelativePaths: true, })
        for (const gitignore of gitignores) ig.add(gitignore)
        // Filter the files array to include only those not ignored
        files = ig.filter(files)
    }
    // Return the filtered list of files
    return files
}
