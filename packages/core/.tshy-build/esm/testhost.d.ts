import { ServerManager, UTF8Decoder, UTF8Encoder, RuntimeHost, ModelConfigurations, ModelConfiguration } from "./host.js";
import { TraceOptions } from "./trace.js";
import { LanguageModel } from "./chat.js";
import { LanguageModelConfiguration, LogLevel, Project, ResponseStatus } from "./server/messages.js";
import { CancellationToken } from "./cancellation.js";
import { McpClientManager } from "./mcpclient.js";
import { ResourceManager } from "./mcpresource.js";
import type { WorkspaceFileSystem, ContentSafety, BrowseSessionOptions, BrowserPage, ShellOptions, ShellOutput, ContainerOptions, ContainerHost, PythonRuntimeOptions, PythonRuntime, Path } from "./types.js";
export declare class TestHost implements RuntimeHost {
    project: Project;
    userState: any;
    server: ServerManager;
    path: Path;
    workspace: WorkspaceFileSystem;
    readonly modelAliases: ModelConfigurations;
    readonly mcp: McpClientManager;
    readonly resources: ResourceManager;
    static install(): void;
    constructor();
    pullModel(cfg: LanguageModelConfiguration, options?: TraceOptions & CancellationToken): Promise<ResponseStatus>;
    clearModelAlias(source: "cli" | "env" | "config" | "script"): void;
    setModelAlias(source: "cli" | "env" | "config", id: string, value: string | ModelConfiguration): void;
    readConfig(): Promise<{}>;
    get config(): {};
    contentSafety(id?: "azure", options?: TraceOptions): Promise<ContentSafety>;
    createUTF8Decoder(): UTF8Decoder;
    createUTF8Encoder(): UTF8Encoder;
    projectFolder(): string;
    resolvePath(...segments: string[]): string;
    readSecret(name: string): Promise<string>;
    browse(url: string, options?: BrowseSessionOptions): Promise<BrowserPage>;
    getLanguageModelConfiguration(modelId: string): Promise<LanguageModelConfiguration>;
    clientLanguageModel?: LanguageModel;
    log(level: LogLevel, msg: string): void;
    readFile(name: string): Promise<Uint8Array>;
    statFile(name: string): Promise<{
        size: number;
        type: "file" | "directory";
    }>;
    writeFile(name: string, content: Uint8Array): Promise<void>;
    deleteFile(name: string): Promise<void>;
    findFiles(pattern: string, options?: unknown): Promise<string[]>;
    createDirectory(name: string): Promise<void>;
    deleteDirectory(name: string): Promise<void>;
    exec(containerId: string, command: string, args: string[], options: ShellOptions): Promise<ShellOutput>;
    container(options: ContainerOptions & TraceOptions): Promise<ContainerHost>;
    /**
     * Instantiates a python evaluation environment
     */
    python(options?: PythonRuntimeOptions): Promise<PythonRuntime>;
    removeContainers(): Promise<void>;
    removeBrowsers(): Promise<void>;
    select(message: string, options: string[]): Promise<string>;
    input(message: string): Promise<string>;
    confirm(message: string): Promise<boolean>;
}
//# sourceMappingURL=testhost.d.ts.map