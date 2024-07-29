import { Embeddings } from "openai/resources/embeddings.mjs"
import { CancellationToken } from "./cancellation"
import { LanguageModel } from "./chat"
import { Progress } from "./progress"
import { AbortSignalOptions, MarkdownTrace, TraceOptions } from "./trace"

// this is typically an instance of TextDecoder
export interface UTF8Decoder {
    decode(
        input: Uint8Array,
        options?: {
            stream?: boolean | undefined
        }
    ): string
}

export interface UTF8Encoder {
    encode(input: string): Uint8Array
}

export enum LogLevel {
    Verbose = 1,
    Info = 2,
    Warn = 3,
    Error = 4,
}

export type APIType = "openai" | "azure" | "localai"

export interface LanguageModelConfiguration {
    provider: string
    model: string
    base: string
    token: string
    curlHeaders?: Record<string, string>
    type?: APIType
    source?: string
    aici?: boolean
    version?: string
}

export interface RetrievalClientOptions {
    progress?: Progress
    token?: CancellationToken
    trace?: MarkdownTrace
}

export interface ResponseStatus {
    ok: boolean
    error?: SerializedError
    status?: number
}

export interface RetrievalSearchOptions extends VectorSearchOptions {
}

export interface RetrievalSearchResponse extends ResponseStatus {
    results: WorkspaceFileWithScore[]
}

export interface ModelService {
    pullModel(model: string): Promise<ResponseStatus>
}

export interface RetrievalService {
    vectorSearch(
        text: string,
        files: WorkspaceFile[],
        options?: RetrievalSearchOptions
    ): Promise<RetrievalSearchResponse>
}

export interface ServerResponse extends ResponseStatus {
    version: string
    node: string
    platform: string
    arch: string
    pid: number
}

export interface ServerManager {
    start(): Promise<void>
    close(): Promise<void>
}

export interface Host {
    readonly dotEnvPath: string
    userState: any

    server: ServerManager
    path: Path

    createUTF8Decoder(): UTF8Decoder
    createUTF8Encoder(): UTF8Encoder
    projectFolder(): string
    installFolder(): string
    resolvePath(...segments: string[]): string

    // read a secret from the environment or a .env file
    readSecret(name: string): Promise<string | undefined>
    defaultModelOptions: Required<Pick<ModelOptions, "model" | "temperature">>
    defaultEmbeddingsModelOptions: Required<
        Pick<EmbeddingsModelOptions, "embeddingsModel">
    >
    getLanguageModelConfiguration(
        modelId: string,
        options?: { token?: boolean } & AbortSignalOptions & TraceOptions
    ): Promise<LanguageModelConfiguration | undefined>
    log(level: LogLevel, msg: string): void
    clientLanguageModel?: LanguageModel

    // fs
    readFile(name: string): Promise<Uint8Array>
    writeFile(name: string, content: Uint8Array): Promise<void>
    deleteFile(name: string): Promise<void>
    findFiles(
        pattern: string | string[],
        options?: {
            ignore?: string | string[]
            applyGitIgnore?: boolean
        }
    ): Promise<string[]>

    // This has mkdirp-semantics (parent directories are created and existing ignored)
    createDirectory(name: string): Promise<void>
    deleteDirectory(name: string): Promise<void>
}

export interface RuntimeHost extends Host {
    models: ModelService
    workspace: Omit<WorkspaceFileSystem, "grep">

    // executes a process
    exec(
        containerId: string,
        command: string,
        args: string[],
        options: ShellOptions & TraceOptions
    ): Promise<ShellOutput>

    /**
     * Starts a container to execute sandboxed code
     * @param options
     */
    container(options: ContainerOptions & TraceOptions): Promise<ContainerHost>

    /**
     * Cleanup all temporary containers.
     */
    removeContainers(): Promise<void>
}

export let host: Host
export function setHost(h: Host) {
    host = h
}
export let runtimeHost: RuntimeHost
export function setRuntimeHost(h: RuntimeHost) {
    setHost(h)
    runtimeHost = h
}
