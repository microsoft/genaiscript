// I2CDriver: A helper class to implement I2C drivers
export abstract class I2CDriver {
    constructor(devAddr: number, options?: I2CDriverOptions)
    async init(): Promise<void>
    protected abstract initDriver(): Promise<void>
    async xfer(writeBuf: Buffer, numRead: number): Promise<Buffer>
    async writeReg(regAddr: number, byte: number): Promise<void>
    async readReg(regAddr: number): Promise<number>
    async writeRegBuf(regAddr: number, b: Buffer): Promise<void>
    async readRegBuf(regAddr: number, size: number): Promise<Buffer>
    async readBuf(size: number): Promise<Buffer>
    async writeBuf(b: Buffer): Promise<void>
}

// I2CSensorDriver: A helper class to implement I2C sensor drivers
export abstract class I2CSensorDriver<TData> extends I2CDriver {
    constructor(devAddr: number, options?: I2CSensorDriverOptions)
    async read(): Promise<TData>
    protected abstract readData(): AsyncValue<TData>
}
