import {
    CONVERTS_DIR_NAME,
    GENAI_ANYTS_REGEX,
    GENAISCRIPT_FOLDER,
    RUNS_DIR_NAME,
    STATS_DIR_NAME,
} from "./constants"
import { randomHex } from "./crypto"
import { ensureDir } from "./fs"
import { gitIgnoreEnsure } from "./gitignore"
import { host } from "./host"

/**
 * Constructs the absolute path for a specified segment within the GenaiScript directory.
 * Combines the project folder path with the GenaiScript folder and the provided segments.
 *
 * @param segments - Variable number of string segments to append to the GenaiScript path.
 * @returns The resolved absolute path as a string.
 */
export function dotGenaiscriptPath(...segments: string[]) {
    return host.resolvePath(
        host.projectFolder(),
        GENAISCRIPT_FOLDER,
        ...segments
    )
}

/**
 * Ensures that the ".genaiscript" directory exists. 
 * If the directory does not exist, it will create the directory 
 * and set up a .gitignore file to ignore all files within 
 * the directory.
 */
export async function ensureDotGenaiscriptPath() {
    const dir = dotGenaiscriptPath(".")
    await ensureDir(dir)
    await gitIgnoreEnsure(dir, ["*"])
}

function friendlyDate() {
    return new Date().toISOString().replace(/[:.]/g, "-")
}

function createDatedFolder(id: string) {
    const name = friendlyDate() + "-" + id
    return name
}

/**
 * Generates the directory path for a specific run of a script.
 * The directory is named with the current date and the provided run ID.
 * The path is constructed using the base name of the script ID and the RUNS_DIR_NAME.
 * 
 * @param scriptId - The identifier for the script being run.
 * @param runId - The identifier for the specific run of the script.
 * @returns The generated directory path for the run.
 */
export function getRunDir(scriptId: string, runId: string) {
    const name = createDatedFolder(runId)
    const out = dotGenaiscriptPath(
        RUNS_DIR_NAME,
        host.path.basename(scriptId).replace(GENAI_ANYTS_REGEX, ""),
        name
    )
    return out
}

/**
 * Generates a directory path for conversion files based on the provided script ID.
 * The directory name includes a friendly date format and a random hexadecimal string.
 * 
 * @param scriptId - The ID of the script for which the conversion directory is being created.
 * @returns The path to the generated conversion directory.
 */
export function getConvertDir(scriptId: string) {
    const name = createDatedFolder(randomHex(6))
    const out = dotGenaiscriptPath(
        CONVERTS_DIR_NAME,
        host.path.basename(scriptId).replace(GENAI_ANYTS_REGEX, ""),
        name
    )
    return out
}

/**
 * Creates a directory for storing video files with a timestamp in its name.
 * The directory is created within the GENAISCRIPT_FOLDER, under a "videos" subfolder.
 * The timestamp is formatted using the ISO standard, replacing colons and periods 
 * with hyphens for compatibility with file systems.
 *
 * @returns The path to the newly created video directory.
 * @throws Will throw an error if the directory cannot be created.
 */
export async function createVideoDir() {
    const dir = dotGenaiscriptPath("videos", friendlyDate())
    await ensureDir(dir)
    return dir
}

/**
 * Creates a directory for storing statistics related to script executions.
 * If the directory does not exist, it will be created.
 *
 * @returns The path to the created statistics directory.
 */
export async function createStatsDir() {
    const statsDir = dotGenaiscriptPath(STATS_DIR_NAME)
    await ensureDir(statsDir)
    return statsDir
}
