export interface Chunk {
    state: "existing" | "deleted" | "added"
    lines: string[]
}

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
