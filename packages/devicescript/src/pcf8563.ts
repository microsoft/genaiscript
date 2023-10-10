import { I2CDriver } from "@devicescript/drivers"

const PCF8563_ADDR = 0x51

const REG_CTRL1 = 0x00
const REG_CTRL2 = 0x01
const REG_TIME = 0x02

export class Date {
    constructor(
        public readonly year: number,
        public readonly month: number,
        public readonly day: number,
        public readonly hours: number,
        public readonly minutes: number,
        public readonly seconds: number
    ) {}
}

export class PCF8563 extends I2CDriver {
    constructor(addr: number = PCF8563_ADDR) {
        super(addr)
    }

    protected async initDriver(): Promise<void> {
        await this.writeReg(REG_CTRL1, 0x00)
        await this.writeReg(REG_CTRL2, 0x00)
    }

    async readTime(): Promise<Date> {
        const timeBuf = await this.readRegBuf(REG_TIME, 7)
        const year = timeBuf[6] + 2000
        const month = timeBuf[5] & 0x1f
        const day = timeBuf[3] & 0x3f
        const hours = timeBuf[2] & 0x3f
        const minutes = timeBuf[1] & 0x7f
        const seconds = timeBuf[0] & 0x7f

        return new Date(year, month - 1, day, hours, minutes, seconds)
    }

    async writeTime(date: Date) {
        // TODO: write date to REG_TIME register
    }
}
