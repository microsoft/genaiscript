import { ensureDir, exists } from "fs-extra"
import { MarkdownTrace, TraceChunkEvent } from "../../core/src/trace"
import { dotGenaiscriptPath, logVerbose } from "../../core/src/util"
import { dirname } from "node:path"
import { appendFileSync, writeFileSync } from "node:fs"
import { TRACE_CHUNK, TRACE_DETAILS } from "../../core/src/constants"
import { writeFile } from "node:fs/promises"

export async function setupTraceWriting(
    trace: MarkdownTrace,
    filename: string
) {
    logVerbose(`trace: ${filename}`)
    await ensureDir(dirname(filename))
    await writeFile(filename, "", { encoding: "utf-8" })
    trace.addEventListener(
        TRACE_CHUNK,
        (ev) => {
            const tev = ev as TraceChunkEvent
            appendFileSync(filename, tev.chunk, { encoding: "utf-8" })
        },
        false
    )
    trace.addEventListener(TRACE_DETAILS, (ev) => {
        const content = trace.content
        writeFileSync(filename, content, { encoding: "utf-8" })
    })
    return filename
}

export async function ensureDotGenaiscriptPath() {
    const dir = dotGenaiscriptPath(".")
    if (await exists(dir)) return

    await ensureDir(dir)
    await writeFile(
        path.join(dir, ".gitattributes"),
        `# avoid merge issues and ignore files in diffs
*.json -diff merge=ours linguist-generated
*.jsonl -diff merge=ours linguist-generated        
*.js -diff merge=ours linguist-generated
`,
        { encoding: "utf-8" }
    )
    await writeFile(path.join(dir, ".gitignore"), "*\n", { encoding: "utf-8" })
}
