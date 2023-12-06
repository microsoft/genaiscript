import {
    Host,
    LogLevel,
    OAIToken,
    ReadFileOptions,
    UTF8Decoder,
    UTF8Encoder,
    defaultLog,
    dotGptoolsPath,
    logWarn,
    parseToken,
    setHost,
    tryReadJSON,
    writeJSON,
} from "gptools-core"
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
        const path = dotGptoolsPath("tmp/token.txt")
        logWarn(`reading token from ${path}`)
        return this.createUTF8Decoder().decode(await this.readFile(path))
    }
    async getSecretToken(): Promise<OAIToken> {
        if (process.env.GPTOOLS_TOKEN) {
            const tok = await parseToken(process.env.GPTOOLS_TOKEN)
            tok.source = "env: gptools_token"
            return tok
        }
        if (process.env.OPENAI_API_KEY) {
            const key = process.env.OPENAI_API_KEY
            const base = process.env.OPENAI_API_BASE
            const type = process.env.OPENAI_API_TYPE
            const version = process.env.OPENAI_API_VERSION
            if (!base) throw new Error("OPENAI_API_BASE not set")
            if (type && type !== "azure")
                throw new Error("OPENAI_API_TYPE must be azure")
            if (version && version !== "2023-03-15-preview")
                throw new Error("OPENAI_API_VERSION must be 2023-03-15-preview")
            const tok = await parseToken(`${base}#oaikey=${key}`)
            tok.source = "env: openai_api_..."
            return tok
        }

        const keyp = dotGptoolsPath("tmp/token.json")
        const tok = await tryReadJSON(keyp)
        if (tok) tok.source = keyp
        return tok
    }
    async setSecretToken(tok: OAIToken): Promise<void> {
        await writeJSON(dotGptoolsPath("tmp/token.json"), tok)
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
