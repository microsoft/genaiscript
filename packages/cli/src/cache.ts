import { join } from "node:path"
import { dotGenaiscriptPath } from "../../core/src/util"
import { emptyDir } from "fs-extra"

/**
 * Asynchronously clears the specified cache directory.
 *
 * This function removes all contents within the cache directory. If the 'name'
 * parameter is 'tests', it specifically targets and clears a subdirectory named 'tests'
 * within the cache directory.
 *
 * @param name - The name of the subdirectory to clear.
 *               If 'tests', it targets a specific subdirectory within the cache.
 */
export async function cacheClear(name: string) {
    // Get the base cache directory path using the dotGenaiscriptPath utility function.
    let dir = dotGenaiscriptPath("cache")

    // If the name is 'tests', adjust the directory path to include the 'tests' subdirectory.
    if (["tests"].includes(name)) dir = join(dir, name)

    // Log the directory being cleared to the console for debugging purposes.
    console.log(`removing ${dir}`)

    // Clear the contents of the directory asynchronously.
    await emptyDir(dir)
}
