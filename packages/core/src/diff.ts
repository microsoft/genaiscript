export interface Chunk {
    state: "existing" | "deleted" | "added"
    lines: string[]
}

/**
 * The LLMD diff format is a simple format that can be used to represent changes. It is not precise:
 * - indentation may be lost
 * - some code may be not regenerated
 */
export function parseLLMDiffs(text: string): Chunk[] {
    /*
 
DIFF src/pcf8563.ts:
`````diff
  async readTime(): Promise<Date> {
-       // TODO
-       return undefined
+       const buf = await this.readRegBuf(REG_SECONDS, 7)
+       const seconds = this.bcdToDecimal(buf[0] & 0x7f)
+       const minutes = this.bcdToDecimal(buf[1] & 0x7f)
+       const hours = this.bcdToDecimal(buf[2] & 0x3f)
+       const day = this.bcdToDecimal(buf[3] & 0x3f)
+       const month = this.bcdToDecimal(buf[5] & 0x1f)
+       const year = this.bcdToDecimal(buf[6]) + 2000
+       return new Date(year, month - 1, day, hours, minutes, seconds)
  }

  async writeTime(date: Date): Promise<void> {
-       // TODO
-       return undefined
+       const buf = this.allocBuffer(7)
+       buf[0] = this.decimalToBcd(date.seconds) & 0x7f
+       buf[1] = this.decimalToBcd(date.minutes) & 0x7f
+       buf[2] = this.decimalToBcd(date.hours) & 0x3f
+       buf[3] = this.decimalToBcd(date.day) & 0x3f
+       buf[4] = 0x00 // Weekday not used, set to 0
+       buf[5] = this.decimalToBcd(date.month + 1) & 0x1f
+       buf[6] = this.decimalToBcd(date.year - 2000)
+       await this.writeRegBuf(REG_SECONDS, buf)
  }
`````

DIFF src/pcf8563.ts:
`````diff
  async stopClock(): Promise<void> {
-       // TODO
+       const seconds = await this.readReg(REG_SECONDS)
+       await this.writeReg(REG_SECONDS, seconds | 0x80)
  }
`````    
            

*/
    const lines = text.split("\n")
    const chunks: Chunk[] = []

    let chunk: Chunk = { state: "existing", lines: [] }
    chunks.push(chunk)

    for (let i = 0; i < lines.length; ++i) {
        const line = lines[i]
        if (line.startsWith("+ ")) {
            const l = line.substring(2)
            if (chunk.state === "added") chunk.lines.push(l)
            else {
                chunk = { state: "added", lines: [l] }
                chunks.push(chunk)
            }
        } else if (line.startsWith("- ")) {
            const l = line.substring(2)
            if (chunk.state === "deleted") chunk.lines.push(l)
            else {
                chunk = { state: "deleted", lines: [l] }
                chunks.push(chunk)
            }
        } else {
            if (chunk.state === "existing") chunk.lines.push(line)
            else {
                chunk = { state: "existing", lines: [line] }
                chunks.push(chunk)
            }
        }
    }

    return chunks
}

function findChunk(lines: string[], chunk: Chunk, startLine: number): number {
    const chunkLines = chunk.lines
    const chunkStart = chunkLines[0].trim()
    let linei = startLine
    while (linei < lines.length) {
        const line = lines[linei].trim()
        if (line === chunkStart) {
            let found = true
            let i = 1
            for (; i < chunkLines.length && linei + i < lines.length; ++i) {
                if (lines[linei + i].trim() !== chunkLines[i].trim()) {
                    found = false
                    break
                }
            }
            if (found && i === chunkLines.length) return linei
        }
        ++linei
    }
    return -1
}

export function applyLLMDiff(source: string, chunks: Chunk[]): string {
    if (!chunks?.length || !source) return source

    chunks = chunks.filter((c) => c.state !== "deleted") // ignore deleted

    const lines = source.split("\n")
    let current = 0
    let i = 0
    while (i < chunks.length) {
        const chunk = chunks[i++]
        if (chunk.state !== "existing")
            throw new Error("expecting existing chunk")
        const addedChunk = chunks[i++]
        if (!addedChunk) break
        if (addedChunk?.state !== "added")
            throw new Error("expecting added chunk")

        // find location of chunk
        const chunkStart = findChunk(lines, chunk, current)
        if (chunkStart === -1) break
        current = chunkStart + chunk.lines.length

        // find the end chunk
        const nextChunk = chunks[i]
        if (nextChunk && nextChunk.state !== "existing")
            throw new Error("expecting existing chunk")
        const chunkEnd = nextChunk
            ? findChunk(lines, nextChunk, current)
            : lines.length

        if (chunkEnd === -1) break

        // finally swap the lines in
        const toRemove = chunkEnd - current
        lines.splice(current, toRemove, ...addedChunk.lines)
        console.log(lines.join("\n"))

        current += addedChunk.lines.length - toRemove
    }

    return lines.join("\n")
}
