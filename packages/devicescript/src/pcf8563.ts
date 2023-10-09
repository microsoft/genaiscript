import { I2CDriver } from "@devicescript/drivers"

const PCF8563_I2C_ADDRESS = 0x51 // Default I2C address found in datasheet
const REG_SECONDS = 0x02 // Register address for seconds found in datasheet

export class PCF8563 extends I2CDriver {
    constructor(i2cAddress: number = PCF8563_I2C_ADDRESS) {
        super(i2cAddress)
    }

    protected async initDriver(): Promise<void> {}

    /**
     * Reads the time and returns a JavaScript Date object.
     */
    async readTime() {
        const data = await this.readRegBuf(REG_SECONDS, 7)
        const seconds = data[0] & 0x7f
        const minutes = data[1] & 0x7f
        const hours = data[2] & 0x3f
        const days = data[3] & 0x3f
        const months = (data[5] & 0x1f) - 1
        const years = data[6] & 0xff

        return { years, months, days, hours, minutes, seconds }
    }
}
