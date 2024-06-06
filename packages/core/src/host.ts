import { CancellationToken } from "./cancellation"
import { LanguageModel } from "./chat"
import { Progress } from "./progress"
import { MarkdownTrace, TraceOptions } from "./trace"

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
    base: string
    token: string
    curlHeaders?: Record<string, string>
    type?: APIType
    source?: string
    aici?: boolean
    version?: string
}

export interface ReadFileOptions {
    virtual?: boolean
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
    files?: string[]
    topK?: number
    minScore?: number
}

export interface RetrievalUpsertOptions extends VectorSearchEmbeddingsOptions {
    content?: string
    mimeType?: string
}

export interface RetrievalSearchResponse extends ResponseStatus {
    results: WorkspaceFileWithScore[]
}

export interface ModelService {
    pullModel(model: string): Promise<ResponseStatus>
}

export interface RetrievalService {
    init(trace?: MarkdownTrace): Promise<void>
    vectorClear(options?: VectorSearchOptions): Promise<ResponseStatus>
    vectorUpsert(
        filenameOrUrl: string,
        options?: RetrievalUpsertOptions
    ): Promise<ResponseStatus>
    vectorSearch(
        text: string,
        options?: RetrievalSearchOptions
    ): Promise<RetrievalSearchResponse>
}

export interface ParsePdfResponse extends ResponseStatus {
    pages?: string[]
}

export interface ParseService {
    init(trace?: MarkdownTrace): Promise<void>
    parsePdf(
        filename: string,
        options?: TraceOptions
    ): Promise<ParsePdfResponse>
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

export interface AskUserOptions {
    /**
     * The text to display underneath the input box.
     */
    prompt: string
    /**
     * An optional string to show as placeholder in the input box to guide the user what to type.
     */
    placeHolder?: string
}

export interface Host {
    userState: any

    parser: ParseService
    retrieval: RetrievalService
    models: ModelService
    server: ServerManager
    path: Path
    workspace: WorkspaceFileSystem

    createUTF8Decoder(): UTF8Decoder
    createUTF8Encoder(): UTF8Encoder
    projectFolder(): string
    installFolder(): string
    resolvePath(...segments: string[]): string

    // read a secret from the environment or a .env file
    readSecret(name: string): Promise<string | undefined>
    getLanguageModelConfiguration(
        modelId: string
    ): Promise<LanguageModelConfiguration | undefined>
    resolveLanguageModel(options: {
        model?: string
        languageModel?: LanguageModel
    }): LanguageModel

    log(level: LogLevel, msg: string): void

    // fs
    readFile(name: string, options?: ReadFileOptions): Promise<Uint8Array>
    writeFile(name: string, content: Uint8Array): Promise<void>
    deleteFile(name: string): Promise<void>
    findFiles(
        pattern: string | string[],
        ignore?: string | string[]
    ): Promise<string[]>

    clearVirtualFiles(): void
    setVirtualFile(name: string, content: string): void
    isVirtualFile(name: string): boolean

    // This has mkdirp-semantics (parent directories are created and existing ignored)
    createDirectory(name: string): Promise<void>
    deleteDirectory(name: string): Promise<void>

    /**
     * Asks the user a questions and returns the answer
     * @param question
     */
    askUser(options: AskUserOptions): Promise<string>

    // executes a process
    exec(
        containerId: string,
        command: string,
        args: string[],
        options: ShellOptions & TraceOptions
    ): Promise<Partial<ShellOutput>>

    /**
     * Starts a container to execute sandboxed code
     * @param options
     */
    container(options: ContainerOptions & TraceOptions): Promise<ContainerHost>

    /**
     * Cleanup all temperorary containers.
     */
    removeContainers(): Promise<void>
}

export let host: Host

export function setHost(h: Host) {
    host = h
}
