import { readFileSync, writeFileSync } from "fs"
import { tokenize } from "./jstokenizer"
import { getSubtasks } from "./refinement"

import {
    applyLLMDiff,
    extractFenced,
    parseLLMDiffs,
    parseProject,
    renderFencedVariables,
} from "coarch-core"
import { NodeHost } from "./hostimpl"

async function main() {
    NodeHost.install()
/*
    const source = `
FILE:
\`\`\`\`\` file=gptools-wp.slides.md
### Slide 1: gptools Overview
\`\`\`\`\`

FILE: gptools-wp2.slides
\`\`\`\`\`
### Slide 1: gptools Overview
\`\`\`\`\`

FILE gptools-wp2.slides.md:
\`\`\`\`\`
### Slide 2: gptools Overview
\`\`\`\`\`

SUMMARY:
\`\`\`\`\`
Created a slidedeck in markdown format for the gptools content, including an overview, key components, workflow, AI-enhanced workflow process, and benefits.
\`\`\`\`\`   
            
    `
    const vars = extractFenced(source)
    console.log(renderFencedVariables(vars))
*/
    const f = `
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
`
    parseLLMDiffs(f)
}

main()
