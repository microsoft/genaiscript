import { readFileSync, writeFileSync } from "fs"
import { tokenize } from "./jstokenizer"
import { getSubtasks } from "./refinement"

import { extractFenced, parseProject } from "coarch-core"
import { NodeHost } from "./hostimpl"

async function main() {
    NodeHost.install()

    const d = `
    
 
DIFF:
\`\`\`\`\`diff file=src/pcf8563.ts
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
+       const seconds = this.decimalToBcd(date.seconds)
+       const minutes = this.decimalToBcd(date.minutes)
+       const hours = this.decimalToBcd(date.hours)
+       const day = this.decimalToBcd(date.day)
+       const month = this.decimalToBcd(date.month + 1)
+       const year = this.decimalToBcd(date.year - 2000)
+       await this.writeRegBuf(REG_SECONDS, Buffer.from([seconds, minutes, hours, day, 0x00, month, year]))
  }
\`\`\`\`\`    
            
    
    `
    const { vars } = extractFenced(d)
    console.log(vars)
}

main()
