import { grepSearch } from "../../core/src/grep"

/**
 * This module exports a function to perform a grep-like search on specified files.
 */

/**
 * Asynchronously performs a grep search pattern on given files and outputs the results.
 *
 * This function takes a search pattern and an array of file paths, and uses the `grepSearch`
 * function to find matches. The results are then output to the console.
 *
 * @param pattern - The search pattern to match within files.
 * @param files - An array of file paths to search within.
 */
export async function grep(pattern: string, paths: string[]) {
    // Perform the search using the grepSearch function and await the result
    const res = await grepSearch(pattern, { path: paths })

    // Output the filenames from the search results, each on a new line
    console.log(
        res.matches
            .map((f) => `${f.filename}: ${f.content.split("\n", 1)[0]}`)
            .join("\n")
    )
}
