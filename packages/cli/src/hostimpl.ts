import {
    Host,
    LogLevel,
    OAIToken,
    ReadFileOptions,
    UTF8Decoder,
    UTF8Encoder,
    defaultLog,
    dotCoarchPath,
    logWarn,
    parseToken,
    setHost,
    tryReadJSON,
    writeJSON,
} from "coarch-core"
import { TextDecoder, TextEncoder } from "util"
import { readFile, writeFile } from "fs/promises"
import { ensureDir } from "fs-extra"
import { resolve, dirname } from "node:path"
import { glob } from "glob"

export class NodeHost implements Host {
    userState: any = {}
    virtualFiles: Record<string, Uint8Array> = {}

    static install() {
        setHost(new NodeHost())
    }

    async askToken(): Promise<string> {
        const path = dotCoarchPath("tmp/token.txt")
        logWarn(`reading token from ${path}`)
        return this.createUTF8Decoder().decode(await this.readFile(path))
    }
    async getSecretToken(): Promise<OAIToken> {
        if (process.env.GPTOOLS_TOKEN) {
            const tok = parseToken(JSON.parse(process.env.GPTOOLS_TOKEN))
            return tok
        }
        return await tryReadJSON(dotCoarchPath("tmp/token.json"))
    }
    async setSecretToken(tok: OAIToken): Promise<void> {
        await writeJSON(dotCoarchPath("tmp/token.json"), tok)
    }
    setVirtualFile(name: string, content: string) {
        this.virtualFiles = {}
        this.virtualFiles[resolve(name)] =
            this.createUTF8Encoder().encode(content)
    }
    isVirtualFile(name: string) {
        return !!this.virtualFiles[name]
    }

    log(level: LogLevel, msg: string): void {
        defaultLog(level, msg)
    }
    createUTF8Decoder(): UTF8Decoder {
        return new TextDecoder("utf-8")
    }
    createUTF8Encoder(): UTF8Encoder {
        return new TextEncoder()
    }
    projectFolder(): string {
        return resolve(".")
    }
    resolvePath(...segments: string[]) {
        return resolve(...segments)
    }
    async readFile(
        name: string,
        options?: ReadFileOptions
    ): Promise<Uint8Array> {
        // virtual file handler
        const v = this.virtualFiles[resolve(name)]
        if (options?.virtual) {
            if (!v) throw new Error("virtual file not found")
            return v // alway return virtual files
        } else if (options?.virtual !== false && !!v) return v // optional return virtual files

        // read file
        return new Uint8Array(await readFile(name))
    }
    async findFiles(path: string): Promise<string[]> {
        const files = await glob(path)
        return files
    }
    async writeFile(name: string, content: Uint8Array): Promise<void> {
        await ensureDir(dirname(name))
        delete this.virtualFiles[resolve(name)]
        await writeFile(name, content)
    }
    async createDirectory(name: string): Promise<void> {
        await ensureDir(name)
    }
}
