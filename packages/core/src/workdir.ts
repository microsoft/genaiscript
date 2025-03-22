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

export function getRunDir(scriptId: string, runId: string) {
    const name = new Date().toISOString().replace(/[:.]/g, "-") + "-" + runId
    const out = dotGenaiscriptPath(
        RUNS_DIR_NAME,
        host.path.basename(scriptId).replace(GENAI_ANYTS_REGEX, ""),
        name
    )
    return out
}

export function getConvertDir(scriptId: string) {
    const runId =
        new Date().toISOString().replace(/[:.]/g, "-") + "-" + randomHex(6)
    const out = dotGenaiscriptPath(
        CONVERTS_DIR_NAME,
        host.path.basename(scriptId).replace(GENAI_ANYTS_REGEX, ""),
        runId
    )
    return out
}

export function getVideoDir() {
    const dir = dotGenaiscriptPath(
        "videos",
        `${new Date().toISOString().replace(/[:.]/g, "-")}`
    )
    return dir
}

export function getStatsDir() {
    const statsDir = dotGenaiscriptPath(STATS_DIR_NAME)
    return statsDir
}
