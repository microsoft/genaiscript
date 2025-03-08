import { readdir } from "fs/promises"
import { join, basename, resolve } from "path"
import { RUNS_DIR_NAME } from "../../core/src/constants"
import { dotGenaiscriptPath } from "../../core/src/util"
import { YAMLStringify } from "../../core/src/yaml"
import { terminalLink } from "../../core/src/terminal"

export async function collectRuns(options?: { scriptid?: string }) {
    const { scriptid } = options || {}
    const runsDir = dotGenaiscriptPath(RUNS_DIR_NAME)
    const scripts = (
        await readdir(runsDir, {
            withFileTypes: true,
        })
    )
        .filter((d) => d.isDirectory())
        .filter((d) => !scriptid || d.name === scriptid)

    const runs: Record<string, string[]> = {}
    for (const sid of scripts) {
        const sdir = join(runsDir, sid.name)
        const reports = (
            await readdir(sdir, {
                withFileTypes: true,
            })
        ).filter((d) => d.isDirectory())
        runs[sid.name] = reports.map((r) => r.name).reverse()
    }
    return runs
}

export function resolveRunDir(scriptId: string, runId: string) {
    return join(dotGenaiscriptPath(RUNS_DIR_NAME), scriptId, runId)
}

export async function listRuns(options?: { scriptid?: string }) {
    const runs = await collectRuns(options)
    for (const sid in runs) {
        console.log(`\n${sid}`)
        for (const rid of runs[sid]) {
            console.log(`  ${rid}`)
        }
    }
}
