import { readFile, writeFile } from "fs/promises"
import {
    LogLevel,
    ModelService,
    LanguageModelConfiguration,
    ParseService,
    ServerManager,
    UTF8Decoder,
    UTF8Encoder,
    setRuntimeHost,
    RuntimeHost,
} from "./host"
import { TraceOptions } from "./trace"
import {
    DEFAULT_EMBEDDINGS_MODEL,
    DEFAULT_MODEL,
    DEFAULT_TEMPERATURE,
} from "./constants"
import {
    dirname,
    extname,
    basename,
    join,
    normalize,
    relative,
    resolve,
    isAbsolute,
} from "node:path"

export function createNodePath(): Path {
    return <Path>Object.freeze({
        dirname,
        extname,
        basename,
        join,
        normalize,
        relative,
        resolve,
        isAbsolute,
    })
}

export class TestHost implements RuntimeHost {
    dotEnvPath: string = undefined
    userState: any
    parser: ParseService
    models: ModelService
    server: ServerManager
    path: Path = createNodePath()
    workspace: WorkspaceFileSystem
    readonly defaultModelOptions = {
        model: DEFAULT_MODEL,
        temperature: DEFAULT_TEMPERATURE,
    }
    readonly defaultEmbeddingsModelOptions = {
        embeddingsModel: DEFAULT_EMBEDDINGS_MODEL,
    }

    static install() {
        setRuntimeHost(new TestHost())
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
    installFolder(): string {
        throw new Error("Method not implemented.")
    }
    resolvePath(...segments: string[]): string {
        throw new Error("Method not implemented.")
    }
    readSecret(name: string): Promise<string> {
        throw new Error("Method not implemented.")
    }
    getLanguageModelConfiguration(
        modelId: string
    ): Promise<LanguageModelConfiguration> {
        throw new Error("Method not implemented.")
    }
    log(level: LogLevel, msg: string): void {
        throw new Error("Method not implemented.")
    }
    async readFile(name: string): Promise<Uint8Array> {
        return new Uint8Array(await readFile(resolve(name)))
    }
    async writeFile(name: string, content: Uint8Array): Promise<void> {
        await writeFile(resolve(name), content)
    }
    deleteFile(name: string): Promise<void> {
        throw new Error("Method not implemented.")
    }
    findFiles(glob: string, options?: {}): Promise<string[]> {
        throw new Error("Method not implemented.")
    }
    createDirectory(name: string): Promise<void> {
        throw new Error("Method not implemented.")
    }
    deleteDirectory(name: string): Promise<void> {
        throw new Error("Method not implemented.")
    }
    exec(
        containerId: string,
        command: string,
        args: string[],
        options: ShellOptions
    ): Promise<ShellOutput> {
        throw new Error("Method not implemented.")
    }
    container(
        options: ContainerOptions & TraceOptions
    ): Promise<ContainerHost> {
        throw new Error("Method not implemented.")
    }
    async removeContainers(): Promise<void> {}
}
