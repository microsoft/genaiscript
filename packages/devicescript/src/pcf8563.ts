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
}
