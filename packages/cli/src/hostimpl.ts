import "dotenv/config"
import {
    Host,
    LogLevel,
    OAIToken,
    ReadFileOptions,
    UTF8Decoder,
    UTF8Encoder,
    parseTokenFromEnv,
    setHost,
} from "gptools-core"
import { TextDecoder, TextEncoder } from "util"
import { readFile, writeFile } from "fs/promises"
import { ensureDir } from "fs-extra"
import { resolve, dirname } from "node:path"
import { glob } from "glob"
import { debug, error, info, warn } from "./log"

export class NodeHost implements Host {
    userState: any = {}
    virtualFiles: Record<string, Uint8Array> = {}

    static install() {
        setHost(new NodeHost())
    }

    async askToken(): Promise<string> {
        return undefined
    }
    async getSecretToken(): Promise<OAIToken> {
        return await parseTokenFromEnv(process.env)
    }
    async setSecretToken(tok: OAIToken): Promise<void> {}
    setVirtualFile(name: string, content: string) {
        this.virtualFiles = {}
        this.virtualFiles[resolve(name)] =
            this.createUTF8Encoder().encode(content)
    }
    isVirtualFile(name: string) {
        return !!this.virtualFiles[name]
    }

    log(level: LogLevel, msg: string): void {
        switch (level) {
            case LogLevel.Error:
                error(msg)
                break
            case LogLevel.Warn:
                warn(msg)
                break
            case LogLevel.Verbose:
                debug(msg)
                break
            case LogLevel.Info:
            default:
                info(msg)
                break
        }
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
