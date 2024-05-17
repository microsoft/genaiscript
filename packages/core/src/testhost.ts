import { readFile, writeFile } from "fs/promises"
import {
    setHost,
    Host,
    AskUserOptions,
    LogLevel,
    ModelService,
    OAIToken,
    ParseService,
    ReadFileOptions,
    RetrievalService,
    ServerManager,
    ShellCallOptions,
    UTF8Decoder,
    UTF8Encoder,
} from "./host"
import { resolve } from "path"

export class TestHost implements Host {
    userState: any
    parser: ParseService
    retrieval: RetrievalService
    models: ModelService
    server: ServerManager
    path: Path
    workspace: WorkspaceFileSystem

    static install() {
        setHost(new TestHost())
    }

    createUTF8Decoder(): UTF8Decoder {
        return new TextDecoder("utf-8")
    }
    createUTF8Encoder(): UTF8Encoder {
        return new TextEncoder()
    }
    projectFolder(): string {
        throw new Error("Method not implemented.")
    }
    installFolder(): string {
        throw new Error("Method not implemented.")
    }
    resolvePath(...segments: string[]): string {
        throw new Error("Method not implemented.")
    }
    readSecret(name: string): Promise<string> {
        throw new Error("Method not implemented.")
    }
    getSecretToken(modelId: string): Promise<OAIToken> {
        throw new Error("Method not implemented.")
    }
    log(level: LogLevel, msg: string): void {
        throw new Error("Method not implemented.")
    }
    async readFile(
        name: string,
        options?: ReadFileOptions
    ): Promise<Uint8Array> {
        return new Uint8Array(await readFile(resolve(name)))
    }
    async writeFile(name: string, content: Uint8Array): Promise<void> {
        await writeFile(resolve(name), content)
    }
    deleteFile(name: string): Promise<void> {
        throw new Error("Method not implemented.")
    }
    findFiles(glob: string): Promise<string[]> {
        throw new Error("Method not implemented.")
    }
    clearVirtualFiles(): void {
        throw new Error("Method not implemented.")
    }
    setVirtualFile(name: string, content: string): void {
        throw new Error("Method not implemented.")
    }
    isVirtualFile(name: string): boolean {
        throw new Error("Method not implemented.")
    }
    createDirectory(name: string): Promise<void> {
        throw new Error("Method not implemented.")
    }
    deleteDirectory(name: string): Promise<void> {
        throw new Error("Method not implemented.")
    }
    askUser(options: AskUserOptions): Promise<string> {
        throw new Error("Method not implemented.")
    }
    exec(
        command: string,
        args: string[],
        options: ShellCallOptions
    ): Promise<Partial<ShellOutput>> {
        throw new Error("Method not implemented.")
    }
}
