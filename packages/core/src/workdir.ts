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

export function dotGenaiscriptPath(...segments: string[]) {
    return host.resolvePath(
        host.projectFolder(),
        GENAISCRIPT_FOLDER,
        ...segments
    )
}

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

export function getRunDir(scriptId: string, runId: string) {
    const name = createDatedFolder(runId)
    const out = dotGenaiscriptPath(
        RUNS_DIR_NAME,
        host.path.basename(scriptId).replace(GENAI_ANYTS_REGEX, ""),
        name
    )
    return out
}

export function getConvertDir(scriptId: string) {
    const name = createDatedFolder(randomHex(6))
    const out = dotGenaiscriptPath(
        CONVERTS_DIR_NAME,
        host.path.basename(scriptId).replace(GENAI_ANYTS_REGEX, ""),
        name
    )
    return out
}

export async function createVideoDir() {
    const dir = dotGenaiscriptPath("videos", friendlyDate())
    await ensureDir(dir)
    return dir
}

export async function createStatsDir() {
    const statsDir = dotGenaiscriptPath(STATS_DIR_NAME)
    await ensureDir(statsDir)
    return statsDir
}
