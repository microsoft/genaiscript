import { ensureDir, exists } from "fs-extra"
import { MarkdownTrace, TraceChunkEvent } from "../../core/src/trace"
import { dotGenaiscriptPath, logVerbose } from "../../core/src/util"
import { dirname, join } from "node:path"
import { writeFileSync, WriteStream } from "node:fs"
import { TRACE_CHUNK, TRACE_DETAILS } from "../../core/src/constants"
import { writeFile } from "node:fs/promises"
import { measure } from "../../core/src/performance"
import { createWriteStream } from "node:fs"

export async function setupTraceWriting(
    trace: MarkdownTrace,
    name: string,
    filename: string
) {
    logVerbose(`${name}: ${filename}`)
    await ensureDir(dirname(filename))
    await writeFile(filename, "", { encoding: "utf-8" })

    // Create a write stream for efficient buffered writes
    let writeStream: WriteStream
    trace.addEventListener(
        TRACE_CHUNK,
        (ev) => {
            const m = measure("trace.chunk")
            if (!writeStream)
                writeStream = createWriteStream(filename, {
                    flags: "a", // 'a' for append mode
                    encoding: "utf8",
                })
            const tev = ev as TraceChunkEvent
            writeStream.write(tev.chunk) // Non-blocking buffered write
            m(`${tev.chunk.length} chars`)
        },
        false
    )

    trace.addEventListener(TRACE_DETAILS, (ev) => {
        const m = measure("trace.details")
        const content = trace.content

        // End the write stream to ensure all data is flushed
        if (writeStream) {
            writeStream.end()
            writeStream = undefined
        }

        // Write the full content
        writeFileSync(filename, content, { encoding: "utf-8" })
        m(`${content.length} chars`)
    })

    return filename
}

export async function ensureDotGenaiscriptPath() {
    const dir = dotGenaiscriptPath(".")
    if (await exists(dir)) return

    await ensureDir(dir)
    await writeFile(
        join(dir, ".gitattributes"),
        `# avoid merge issues and ignore files in diffs
*.json -diff merge=ours linguist-generated
*.jsonl -diff merge=ours linguist-generated        
*.js -diff merge=ours linguist-generated
`,
        { encoding: "utf-8" }
    )
    await writeFile(join(dir, ".gitignore"), "*\n", { encoding: "utf-8" })
}
