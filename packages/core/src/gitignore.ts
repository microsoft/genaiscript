// Import the 'ignore' library to handle .gitignore file parsing and filtering
import ignorer from "ignore"

/**
 * Filters a list of files based on the patterns specified in a .gitignore string.
 * Utilizes the 'ignore' library to determine which files should be excluded.
 *
 * @param gitignore - The content of a .gitignore file as a string.
 * If this is empty or null, no filtering occurs.
 * @param files - An array of file paths to be filtered.
 * @returns An array of files that are not ignored according to the .gitignore patterns.
 */
export async function filterGitIgnore(gitignore: string, files: string[]) {
    // Check if the .gitignore content is provided
    if (gitignore) {
        // Create an ignorer instance and add the .gitignore patterns to it
        const ig = ignorer().add(gitignore)
        // Filter the files array to include only those not ignored
        files = ig.filter(files)
    }
    // Return the filtered list of files
    return files
}
