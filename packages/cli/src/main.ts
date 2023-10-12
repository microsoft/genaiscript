import { readFileSync, writeFileSync } from "fs"
import { tokenize } from "./jstokenizer"
import { getSubtasks } from "./refinement"

import { applyLLMDiff, extractFenced, parseLLMDiffs, parseProject, renderFencedVariables } from "coarch-core"
import { NodeHost } from "./hostimpl"

async function main() {
    NodeHost.install()

    const source = `

import { I2CDriver } from "@devicescript/drivers"
import { Date } from "./date"

const PCF8563_I2C_ADDR = 0x51 // Default I2C address from datasheet

const REG_SECONDS = 0x02 // Register address for SECONDS from datasheet

export class PCF8563 extends I2CDriver {
    constructor(i2cAddress: number = PCF8563_I2C_ADDR) {
        super(i2cAddress)
    }

    protected async initDriver(): Promise<void> {
        // Initialization sequence to set control registers
        await this.writeReg(0x00, 0x00) // Control1 register: disable all alarms and interrupts
        await this.writeReg(0x01, 0x00) // Control2 register: disable all alarms and interrupts
    }

    async readTime(): Promise<Date> {
        // TODO
        return undefined
    }

    async writeTime(date: Date): Promise<void> {
        // TODO
        return undefined
    }

    private bcdToDecimal(bcd: number): number {
        return (bcd >> 4) * 10 + (bcd & 0x0f)
    }

    private decimalToBcd(decimal: number): number {
        return ((decimal / 10) << 4) | decimal % 10
    }

    async stopClock(): Promise<void> {
        // TODO
    }
}
    

`

    const d = `
 
DIFF src/pcf8563.ts:
\`\`\`\`\`diff
  protected async initDriver(): Promise<void> {
      // Initialization sequence to set control registers
      await this.writeReg(0x00, 0x00) // Control1 register: disable all alarms and interrupts
      await this.writeReg(0x01, 0x00) // Control2 register: disable all alarms and interrupts
  }

+ async readTime(): Promise<Date> {
+     const buf = await this.readRegBuf(REG_SECONDS, 7)
+     const seconds = this.bcdToDecimal(buf[0] & 0x7f)
+     const minutes = this.bcdToDecimal(buf[1] & 0x7f)
+     const hours = this.bcdToDecimal(buf[2] & 0x3f)
+     const days = this.bcdToDecimal(buf[3] & 0x3f)
+     const months = this.bcdToDecimal(buf[5] & 0x1f)
+     const years = this.bcdToDecimal(buf[6]) + 2000
+     return new Date(years, months - 1, days, hours, minutes, seconds)
+ }

+ async writeTime(date: Date): Promise<void> {
+     const buf = this.allocBuffer(7)
+     buf[0] = this.decimalToBcd(date.seconds) & 0x7f
+     buf[1] = this.decimalToBcd(date.minutes) & 0x7f
+     buf[2] = this.decimalToBcd(date.hours) & 0x3f
+     buf[3] = this.decimalToBcd(date.day) & 0x3f
+     buf[4] = 0x00 // Weekday not used
+     buf[5] = this.decimalToBcd(date.month + 1) & 0x1f
+     buf[6] = this.decimalToBcd(date.year - 2000)
+     await this.writeRegBuf(REG_SECONDS, buf)
+ }

  private bcdToDecimal(bcd: number): number {
      return (bcd >> 4) * 10 + (bcd & 0x0f)
  }
\`\`\`\`\`

DIFF src/pcf8563.ts:
\`\`\`\`\`diff
  private bcdToDecimal(bcd: number): number {
      return (bcd >> 4) * 10 + (bcd & 0x0f)
  }

  private decimalToBcd(decimal: number): number {
      return ((decimal / 10) << 4) | decimal % 10
  }

+ async stopClock(): Promise<void> {
+     const seconds = await this.readReg(REG_SECONDS)
+     await this.writeReg(REG_SECONDS, seconds | 0x80)
+ }
\`\`\`\`\`

    `
    const vars = extractFenced(d)
    console.log(renderFencedVariables(vars))
    console.log('--------------------------------------------------')
    vars.filter(({ label }) => /^diff/i.test(label)).forEach(({ content }) => {
        console.log("SOURCE")
        console.log(content)
        const chunks = parseLLMDiffs(content)
        console.log("CHUNKS")
        console.log(chunks)
        const patched = applyLLMDiff(source, chunks)
        console.log("PATCHED")
        console.log(patched)
    })
}

main()
