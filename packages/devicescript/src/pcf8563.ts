import { I2CDriver } from "./driver";

const PCF8563_ADDR = 0x51; // Default I2C address from datasheet

// Register addresses from datasheet
const SECONDS_REG = 0x02;
const MINUTES_REG = 0x03;
const HOURS_REG = 0x04;

export class PCF8563 extends I2CDriver {
  constructor(devAddr: number = PCF8563_ADDR, options: any = {}) {
    super(devAddr, options);
  }

  async init() {
    await this.initDriver();
    // TODO: generate device initialization sequence to set control registers
    await this.writeReg(0x00, 0x00); // Control register 1
    await this.writeReg(0x01, 0x00); // Control register 2
  }

  async readTime(): Promise<Date> {
    const buf = await this.readRegBuf(SECONDS_REG, 3);
    const seconds = this.bcdToDecimal(buf[0] & 0x7F);
    const minutes = this.bcdToDecimal(buf[1] & 0x7F);
    const hours = this.bcdToDecimal(buf[2] & 0x3F);

    return new Date(0, 0, 0, hours, minutes, seconds);
  }

  async writeTime(date: Date) {
    const seconds = this.decimalToBcd(date.getSeconds());
    const minutes = this.decimalToBcd(date.getMinutes());
    const hours = this.decimalToBcd(date.getHours());

    await this.writeRegBuf(SECONDS_REG, Buffer.from([seconds, minutes, hours]));
  }

  private bcdToDecimal(bcd: number): number {
    return (bcd >> 4) * 10 + (bcd & 0x0F);
  }

  private decimalToBcd(decimal: number): number {
    return ((decimal / 10) << 4) | (decimal % 10);
  }
}
