import { readdir } from "fs/promises"
import { join } from "path"
import { RUNS_DIR_NAME, SERVER_PORT } from "../../core/src/constants"
import { dotGenaiscriptPath, groupBy } from "../../core/src/util"
import { runtimeHost } from "../../core/src/host"

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

    const runs: {
        scriptId: string
        name: string
        runId: string
        dir: string
        creationTme: string
        report: number
        trace: number
    }[] = []
    for (const sid of scripts) {
        const sdir = join(runsDir, sid.name)
        // Check if the script directory exists
        if ((await runtimeHost.statFile(sdir))?.type !== "directory") continue
        const reports = (
            await readdir(sdir, {
                withFileTypes: true,
            })
        ).filter((d) => d.isDirectory())
        for (const r of reports) {
            const resjson = await runtimeHost.statFile(
                join(sdir, r.name, "res.json")
            )
            const tracemd = await runtimeHost.statFile(
                join(sdir, r.name, "trace.md")
            )
            runs.push({
                scriptId: sid.name,
                runId: r.name.split(/-/g).at(-1),
                creationTme: r.name.split(/-/g).slice(0, -1).join(" "),
                name: r.name,
                dir: join(sdir, r.name),
                report: resjson?.type === "file" ? resjson.size : 0,
                trace: tracemd?.type === "file" ? tracemd.size : 0,
            })
        }
    }
    return runs
}

export function resolveRunDir(scriptId: string, runId: string) {
    return join(dotGenaiscriptPath(RUNS_DIR_NAME), scriptId, runId)
}

export async function listRuns(options?: { scriptid?: string }) {
    const runs = await collectRuns(options)
    const groups = groupBy(runs, (r) => r.scriptId)
    for (const sid in groups) {
        console.log(`\n${sid}`)
        for (const rid of groups[sid]) {
            console.log(
                `  ${rid.runId} ${rid.name} https://localhost:${SERVER_PORT}/#run=${rid.runId}`
            )
        }
    }
}
