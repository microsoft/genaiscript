prompt({
    title: "TODOs",
    description: "Try to implement TODOs found in source code.",
    categories: ["devicescript"],
    system: ["system"]
})

def("SPEC", env.file)
def("CODE", env.links.filter(f => f.filename.endsWith(".ts")))

$`You are an expert at DeviceScript (https://microsoft.github.io/devicescript), a TypeScript compiler and runtime for embedded devices.`

$`The base classes for I2C drivers are at https://github.com/microsoft/devicescript/blob/main/packages/drivers/src/driver.ts .
The symbols are in the '@devicescript/drivers' module.

\`\`\`ts
/**
 * A helper class to implement I2C drivers
 */
export abstract class I2CDriver {
    /**
     * Instantiate a driver
     * @param devAddr a 7 bit i2c address
     * @param options
     */
    constructor(devAddr: number, options?: I2CDriverOptions);

    /**
     * Allocates a Buffer of size length bytes.
     */
    protected allocBuffer(length: number): Buffer;

    /**
     * Initializes the I2C device
     * @throws DriverError
     */
    async init(): Promise<void> {
        await this.initDriver()
    }

    /**
     * Initializes the I2C device
     * @throws I2CError
     */
    protected abstract initDriver(): Promise<void>;

    /**
     * Execute I2C transaction
     * @param devAddr a 7 bit i2c address
     * @param writeBuf the value to write
     * @param numRead number of bytes to read afterwards
     * @returns a buffer "numRead" bytes long
     */
    async xfer(writeBuf: Buffer, numRead: number): Promise<Buffer>;

    /**
     * Write a byte to a register
     * @param devAddr a 7 bit i2c address
     * @param regAddr an 8 bit register address
     * @param byte the value to write
     * @throws I2CError
     */
    async writeReg(regAddr: number, byte: number): Promise<void>;

    /**
     * read a byte from a register
     * @param devAddr a 7 bit i2c address
     * @param regAddr an 8 bit register address
     * @returns a byte
     * @throws I2CError
     */
    async readReg(regAddr: number): Promise<number>;
    /**
     * write a buffer to a register
     * @param devAddr a 7 bit i2c address
     * @param regAddr an 8 bit register address
     * @param b a byte buffer
     * @throws I2CError
     */
    async writeRegBuf(regAddr: number, b: Buffer): Promise<void>;
    /**
     * read a buffer from a register
     * @param devAddr a 7 bit i2c address
     * @param regAddr an 8 bit register address
     * @param size the number of bytes to request
     * @returns a byte buffer
     * @throws I2CError
     */
    async readRegBuf(regAddr: number, size: number): Promise<Buffer>;
    /**
     * read a raw buffer
     * @param devAddr a 7 bit i2c address
     * @param size the number of bytes to request
     * @returns a byte buffer
     * @throws I2CError
     */
    async readBuf(size: number): Promise<Buffer>;
    /**
     * write a raw buffer
     * @param devAddr a 7 bit i2c address
     * @param b a byte buffer
     * @throws I2CError
     */
    async writeBuf(b: Buffer): Promise<void>;
}
\`\`\`

`

$`In CODE, when you encounter a comment starting by "TODO", generate code for the TODO comment in a diff format
where added lines start with +, deleted lines start with -, do not add line numbers, use the information in SPEC:

DIFF /path_to_file/file.ts:
${env.fence}diff
  3 lines or more of code above changes
- deleted line
- deleted line 2
+ added line
+ added line 2
  3 lines or more of code above changes
${env.fence}
`

$`Do not generate anything else than DIFF sections.`

$`
TypeScript style guidance:
-  Use export keyboard on classes.
-  generate const declarations for constants found in datasheets; specify where the constant value was found. Avoid magic numbers in generated code.
-  always await async functions or functions that return a Promise.
-  Use Buffer (like node.js) instead of Uint8Array. Don't use Uint8Array.
`