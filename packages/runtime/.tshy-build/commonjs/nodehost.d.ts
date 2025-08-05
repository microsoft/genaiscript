import { McpClientManager, ResourceManager, PLimitPromiseQueue } from "@genaiscript/core";
import type { CancellationOptions, ContainerHost, ContainerOptions, ContentSafety, ElementOrArray, HostConfiguration, LanguageModelConfiguration, LogLevel, ModelConfiguration, ModelConfigurations, Project, ResponseStatus, ShellOptions, TraceOptions, RuntimeHost, ServerManager, AzureTokenResolver, LanguageModel } from "@genaiscript/core";
import { DockerManager } from "./docker.js";
declare class NodeServerManager implements ServerManager {
    start(): Promise<void>;
    close(): Promise<void>;
}
export declare class NodeHost extends EventTarget implements RuntimeHost {
    private pulledModels;
    private readonly _dotEnvPaths;
    private _hostConfig;
    project: Project;
    userState: any;
    readonly path: import("@genaiscript/core").Path;
    readonly server: NodeServerManager;
    readonly workspace: Omit<import("@genaiscript/core").WorkspaceFileSystem, "grep" | "writeCached">;
    readonly containers: DockerManager;
    private readonly _modelAliases;
    private _config;
    readonly userInputQueue: PLimitPromiseQueue;
    readonly azureToken: AzureTokenResolver;
    readonly azureAIInferenceToken: AzureTokenResolver;
    readonly azureAIServerlessToken: AzureTokenResolver;
    readonly azureManagementToken: AzureTokenResolver;
    readonly microsoftGraphToken: AzureTokenResolver;
    readonly mcp: McpClientManager;
    readonly resources: ResourceManager;
    constructor(dotEnvPaths: string[]);
    get hostConfig(): HostConfiguration;
    get modelAliases(): Readonly<ModelConfigurations>;
    updateHostConfig(config: Partial<HostConfiguration>): void;
    clearModelAlias(source: "cli" | "env" | "config" | "script"): void;
    setModelAlias(source: "cli" | "env" | "config" | "script", id: string, value: string | ModelConfiguration): void;
    pullModel(cfg: LanguageModelConfiguration, options?: TraceOptions & CancellationOptions): Promise<ResponseStatus>;
    readConfig(): Promise<HostConfiguration>;
    get config(): HostConfiguration;
    static install(dotEnvPaths?: ElementOrArray<string>, hostConfig?: HostConfiguration): Promise<NodeHost>;
    readSecret(name: string): Promise<string | undefined>;
    clientLanguageModel: LanguageModel;
    getLanguageModelConfiguration(modelId: string, options?: {
        token?: boolean;
    } & CancellationOptions & TraceOptions): Promise<LanguageModelConfiguration>;
    log(level: LogLevel, msg: string): void;
    projectFolder(): string;
    resolvePath(...segments: string[]): string;
    statFile(name: string): Promise<{
        size: number;
        type: "file" | "directory" | "symlink";
    }>;
    readFile(filepath: string): Promise<Uint8Array>;
    findFiles(path: ElementOrArray<string>, options: {
        ignore?: ElementOrArray<string>;
        applyGitIgnore?: boolean;
    }): Promise<string[]>;
    writeFile(name: string, content: Uint8Array): Promise<void>;
    deleteFile(name: string): Promise<void>;
    createDirectory(name: string): Promise<void>;
    deleteDirectory(name: string): Promise<void>;
    contentSafety(id?: "azure", options?: TraceOptions & CancellationOptions): Promise<ContentSafety>;
    exec(containerId: string, command: string, args: string[], options: ShellOptions & TraceOptions & CancellationOptions): Promise<import("@genaiscript/core").ShellOutput>;
    /**
     * Starts a container to execute sandboxed code
     * @param options
     */
    container(options: ContainerOptions & TraceOptions): Promise<ContainerHost>;
    removeContainers(): Promise<void>;
    /**
     * Asks the user to select between options
     * @param message question to ask
     * @param options options to select from
     */
    select(message: string, options: string[]): Promise<string | undefined>;
    /**
     * Asks the user to input a text
     * @param message message to ask
     */
    input(message: string): Promise<string | undefined>;
    /**
     * Asks the user to confirm a message
     * @param message message to ask
     */
    confirm(message: string): Promise<boolean | undefined>;
}
export {};
//# sourceMappingURL=nodehost.d.ts.map