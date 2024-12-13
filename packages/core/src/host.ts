import { CancellationToken } from "./cancellation"
import { LanguageModel } from "./chat"
import { Progress } from "./progress"
import { AbortSignalOptions, MarkdownTrace, TraceOptions } from "./trace"
import { Project } from "./server/messages"
import { HostConfiguration } from "./hostconfiguration"

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

export type OpenAIAPIType =
    | "openai"
    | "azure"
    | "localai"
    | "azure_serverless"
    | "azure_serverless_models"
    | "alibaba"

export type AzureCredentialsType =
    | "default"
    | "cli"
    | "env"
    | "powershell"
    | "devcli"
    | "managedidentity"
    | "workloadidentity"

export interface LanguageModelConfiguration extends LanguageModelReference {
    base: string
    token: string
    source?: string
    type?: OpenAIAPIType
    aici?: boolean
    version?: string
    azureCredentialsType?: AzureCredentialsType
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

export interface RetrievalSearchOptions extends VectorSearchOptions {}

export interface RetrievalSearchResponse extends ResponseStatus {
    results: WorkspaceFileWithScore[]
}

export interface ModelService {
    pullModel(model: string, options?: TraceOptions): Promise<ResponseStatus>
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

export interface AuthenticationToken {
    token: string
    expiresOnTimestamp: number
}

export function isAzureTokenExpired(token: AuthenticationToken) {
    // Consider the token expired 5 seconds before the actual expiration to avoid timing issues
    return !token || token.expiresOnTimestamp < Date.now() - 5_000
}

export interface AzureTokenResolver {
    token(
        credentialsType: AzureCredentialsType,
        options?: AbortSignalOptions
    ): Promise<AuthenticationToken>
}

export type ModelConfiguration = Readonly<
    Pick<ModelOptions, "model" | "temperature"> & {
        source: "cli" | "env" | "config" | "default"
    }
>

export type ModelConfigurations = {
    large: ModelConfiguration
    small: ModelConfiguration
    vision: ModelConfiguration
    embeddings: ModelConfiguration
} & Record<string, ModelConfiguration>

export interface Host {
    userState: any
    server: ServerManager
    path: Path

    createUTF8Decoder(): UTF8Decoder
    createUTF8Encoder(): UTF8Encoder
    projectFolder(): string
    installFolder(): string
    resolvePath(...segments: string[]): string

    getLanguageModelConfiguration(
        modelId: string,
        options?: { token?: boolean } & AbortSignalOptions & TraceOptions
    ): Promise<LanguageModelConfiguration | undefined>
    log(level: LogLevel, msg: string): void
    clientLanguageModel?: LanguageModel

    // fs
    statFile(name: string): Promise<{
        size: number
        type: "file" | "directory" | "symlink"
    }>
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
    project: Project
    models: ModelService
    workspace: Omit<WorkspaceFileSystem, "grep">
    azureToken: AzureTokenResolver
    modelAliases: Readonly<ModelConfigurations>

    setModelAlias(
        source: "env" | "cli" | "config",
        id: string,
        value: string | Omit<ModelConfiguration, "source">
    ): void

    readConfig(): Promise<HostConfiguration>
    readSecret(name: string): Promise<string | undefined>
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
     * Launches a browser page
     * @param url
     * @param options
     */
    browse(
        url: string,
        options?: BrowseSessionOptions & TraceOptions
    ): Promise<BrowserPage>

    /**
     * Cleanup all temporary containers.
     */
    removeContainers(): Promise<void>

    /**
     * Cleanup all temporary browsers.
     */
    removeBrowsers(): Promise<void>

    /**
     * Asks the user to select between options
     * @param message question to ask
     * @param options options to select from
     */
    select(
        message: string,
        choices: (string | ShellSelectChoice)[],
        options?: ShellSelectOptions
    ): Promise<string>

    /**
     * Asks the user to input a text
     * @param message message to ask
     */
    input(message: string, options?: ShellInputOptions): Promise<string>

    /**
     * Asks the user to confirm a message
     * @param message message to ask
     */
    confirm(message: string, options?: ShellConfirmOptions): Promise<boolean>

    /**
     * Instantiates a content safety client
     * @param id
     */
    contentSafety(
        id?: ContentSafetyProvider,
        options?: TraceOptions
    ): Promise<ContentSafety>
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
