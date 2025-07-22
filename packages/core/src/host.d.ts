import type { CancellationOptions, CancellationToken } from "./cancellation.js";
import type { LanguageModel } from "./chat.js";
import type { Progress } from "./progress.js";
import type { MarkdownTrace, TraceOptions } from "./trace.js";
import type { AzureCredentialsType, LanguageModelConfiguration, LogLevel, Project, ResponseStatus } from "./server/messages.js";
import type { HostConfiguration } from "./hostconfiguration.js";
import type { TokenCredential } from "@azure/identity";
import type { McpClientManager } from "./mcpclient.js";
import type { ResourceManager } from "./mcpresource.js";
import type { ContainerHost, ContainerOptions, ContentSafety, ContentSafetyProvider, ModelOptions, Path, SerializedError, ShellOutput, ShellSelectChoice, ShellSelectOptions, ShellInputOptions, ShellConfirmOptions, ShellOptions, WorkspaceFile, WorkspaceFileSystem, WorkspaceFileWithScore, VectorSearchOptions } from "./types.js";
export declare class LogEvent extends Event {
    readonly level: LogLevel;
    readonly message: string;
    static Name: string;
    constructor(level: LogLevel, message: string);
}
export interface UTF8Decoder {
    decode(input: Uint8Array, options?: {
        stream?: boolean | undefined;
    }): string;
}
export interface UTF8Encoder {
    encode(input: string): Uint8Array;
}
export interface RetrievalClientOptions {
    progress?: Progress;
    token?: CancellationToken;
    trace?: MarkdownTrace;
}
export interface RetrievalSearchOptions extends VectorSearchOptions {
}
export interface RetrievalSearchResponse extends ResponseStatus {
    results: WorkspaceFileWithScore[];
}
export interface RetrievalService {
    vectorSearch(text: string, files: WorkspaceFile[], options?: RetrievalSearchOptions): Promise<RetrievalSearchResponse>;
}
export interface ServerManager {
    start(): Promise<void>;
    close(): Promise<void>;
}
export interface AuthenticationToken {
    token: string;
    expiresOnTimestamp: number;
    credential: TokenCredential;
}
/**
 * Determines whether an Azure authentication token has expired.
 *
 * @param token - The authentication token to check. Contains the token string, expiration timestamp, and credential object.
 *                If null or undefined, the token is considered expired.
 * @returns True if the token is expired or invalid; false otherwise.
 *
 * Note: The function considers a token expired if its expiration timestamp is within 5 seconds
 * of the current time, to account for potential timing discrepancies.
 */
export declare function isAzureTokenExpired(token: AuthenticationToken): boolean;
export interface AzureTokenResolver {
    token(credentialsType: AzureCredentialsType, options?: CancellationOptions): Promise<{
        token?: AuthenticationToken;
        error?: SerializedError;
    }>;
}
export type ModelConfiguration = Readonly<Pick<ModelOptions, "model" | "temperature" | "reasoningEffort" | "fallbackTools"> & {
    source: "cli" | "env" | "script" | "config" | "default";
    candidates?: string[];
}>;
export type ModelConfigurations = {
    large: ModelConfiguration;
    small: ModelConfiguration;
    vision: ModelConfiguration;
    embeddings: ModelConfiguration;
} & Record<string, ModelConfiguration>;
export interface Host {
    userState: Record<string, unknown>;
    server: ServerManager;
    path: Path;
    projectFolder(): string;
    resolvePath(...segments: string[]): string;
    getLanguageModelConfiguration(modelId: string, options?: {
        token?: boolean;
    } & CancellationOptions & TraceOptions): Promise<LanguageModelConfiguration | undefined>;
    log(level: LogLevel, msg: string): void;
    statFile(name: string): Promise<{
        size: number;
        type: "file" | "directory" | "symlink";
    }>;
    readFile(name: string): Promise<Uint8Array>;
    writeFile(name: string, content: Uint8Array): Promise<void>;
    deleteFile(name: string): Promise<void>;
    findFiles(pattern: string | string[], options?: {
        ignore?: string | string[];
        applyGitIgnore?: boolean;
    }): Promise<string[]>;
    createDirectory(name: string): Promise<void>;
    deleteDirectory(name: string): Promise<void>;
}
export interface RuntimeHost extends Host {
    project: Project;
    workspace: Omit<WorkspaceFileSystem, "grep" | "writeCached">;
    azureToken?: AzureTokenResolver;
    azureAIServerlessToken?: AzureTokenResolver;
    azureManagementToken?: AzureTokenResolver;
    microsoftGraphToken?: AzureTokenResolver;
    modelAliases: Readonly<ModelConfigurations>;
    clientLanguageModel?: LanguageModel;
    mcp: McpClientManager;
    resources: ResourceManager;
    pullModel(cfg: LanguageModelConfiguration, options?: TraceOptions & CancellationOptions): Promise<ResponseStatus>;
    clearModelAlias(source: "cli" | "env" | "config" | "script"): void;
    setModelAlias(source: "env" | "cli" | "config" | "script", id: string, value: string | Omit<ModelConfiguration, "source">): void;
    /**
     * Reloads the configuration
     */
    readConfig(): Promise<HostConfiguration>;
    /**
     * Gets the current loaded configuration
     */
    get config(): HostConfiguration;
    /**
     * Reads a secret
     * @param name
     */
    readSecret(name: string): Promise<string | undefined>;
    exec(containerId: string, command: string, args: string[], options: ShellOptions & TraceOptions & CancellationOptions): Promise<ShellOutput>;
    /**
     * Starts a container to execute sandboxed code
     * @param options
     */
    container(options: ContainerOptions & TraceOptions): Promise<ContainerHost>;
    /**
     * Cleanup all temporary containers.
     */
    removeContainers(): Promise<void>;
    /**
     * Asks the user to select between options
     * @param message question to ask
     * @param options options to select from
     */
    select(message: string, choices: (string | ShellSelectChoice)[], options?: ShellSelectOptions): Promise<string>;
    /**
     * Asks the user to input a text
     * @param message message to ask
     */
    input(message: string, options?: ShellInputOptions): Promise<string>;
    /**
     * Asks the user to confirm a message
     * @param message message to ask
     */
    confirm(message: string, options?: ShellConfirmOptions): Promise<boolean>;
    /**
     * Instantiates a content safety client
     * @param id
     */
    contentSafety(id?: ContentSafetyProvider, options?: TraceOptions & CancellationOptions): Promise<ContentSafety>;
}
export declare function resolveRuntimeHost(): RuntimeHost;
/**
 * Sets the runtime host instance and updates the global host reference.
 *
 * @param h - An instance of RuntimeHost representing the runtime host to be set.
 *            This will also update the `host` to refer to the same instance.
 */
export declare function setRuntimeHost(h: RuntimeHost): void;
export declare function checkRuntime(): void;
//# sourceMappingURL=host.d.ts.map