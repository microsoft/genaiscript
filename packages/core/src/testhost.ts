// This module defines a TestHost class that implements the RuntimeHost interface.
// It provides various functionalities related to language models, file operations, and other utilities.
// Tags: RuntimeHost, TestHost, LanguageModel, FileSystem, Node.js

// Import necessary modules and functions from various files
import { readFile, writeFile } from "fs/promises"
import { ensureDir } from "fs-extra"
import {
    ServerManager,
    UTF8Decoder,
    UTF8Encoder,
    setRuntimeHost,
    RuntimeHost,
    AzureTokenResolver,
    ModelConfigurations,
    ModelConfiguration,
} from "./host"
import { TraceOptions } from "./trace"
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
import { LanguageModel } from "./chat"
import { NotSupportedError } from "./error"
import {
    LanguageModelConfiguration,
    LogLevel,
    Project,
    ResponseStatus,
} from "./server/messages"
import { defaultModelConfigurations } from "./llms"
import { CancellationToken } from "./cancellation"

// Function to create a frozen object representing Node.js path methods
// This object provides utility methods for path manipulations
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

// Class representing a test host for runtime, implementing the RuntimeHost interface
export class TestHost implements RuntimeHost {
    project: Project
    // State object to store user-specific data
    userState: any = {}
    // Server management service
    server: ServerManager
    // Instance of the path utility
    path: Path = createNodePath()
    // File system for workspace
    workspace: WorkspaceFileSystem
    azureToken: AzureTokenResolver = undefined
    azureServerlessToken: AzureTokenResolver = undefined
    microsoftGraphToken: AzureTokenResolver = undefined

    // Default options for language models
    readonly modelAliases: ModelConfigurations = defaultModelConfigurations()

    // Static method to set this class as the runtime host
    static install() {
        setRuntimeHost(new TestHost())
    }
    async pullModel(
        cfg: LanguageModelConfiguration,
        options?: TraceOptions & CancellationToken
    ): Promise<ResponseStatus> {
        return { ok: true }
    }

    clearModelAlias(source: "cli" | "env" | "config" | "script"): void {
        ;(this.modelAliases as any)[source] = {}
    }
    setModelAlias(
        source: "cli" | "env" | "config",
        id: string,
        value: string | ModelConfiguration
    ): void {
        if (typeof value === "string") value = { source, model: value }
        this.modelAliases[id] = value
    }
    async readConfig() {
        return {}
    }

    get config() {
        return {}
    }

    contentSafety(
        id?: "azure",
        options?: TraceOptions
    ): Promise<ContentSafety> {
        throw new NotSupportedError("contentSafety")
    }

    // Method to create a UTF-8 decoder
    createUTF8Decoder(): UTF8Decoder {
        return new TextDecoder("utf-8")
    }

    // Method to create a UTF-8 encoder
    createUTF8Encoder(): UTF8Encoder {
        return new TextEncoder()
    }

    // Method to get the current project folder path
    projectFolder(): string {
        return resolve(".")
    }

    // Placeholder for the method to get the installation folder path
    installFolder(): string {
        throw new Error("Method not implemented.")
    }

    // Placeholder for path resolution method
    resolvePath(...segments: string[]): string {
        return this.path.resolve(...segments)
    }

    // Placeholder for reading a secret value
    readSecret(name: string): Promise<string> {
        throw new Error("Method not implemented.")
    }

    // Placeholder for browsing a URL
    browse(url: string, options?: BrowseSessionOptions): Promise<BrowserPage> {
        throw new Error("Method not implemented.")
    }

    // Placeholder for getting language model configuration
    getLanguageModelConfiguration(
        modelId: string
    ): Promise<LanguageModelConfiguration> {
        throw new Error("Method not implemented.")
    }

    // Optional client language model
    clientLanguageModel?: LanguageModel

    // Placeholder for logging functionality
    log(level: LogLevel, msg: string): void {
        console[level](msg)
    }

    // Method to read a file and return its content as a Uint8Array
    async readFile(name: string): Promise<Uint8Array> {
        return new Uint8Array(await readFile(resolve(name)))
    }

    async statFile(name: string): Promise<{
        size: number
        type: "file" | "directory"
    }> {
        return undefined
    }

    // Method to write content to a file
    async writeFile(name: string, content: Uint8Array): Promise<void> {
        await writeFile(resolve(name), content)
    }

    // Placeholder for file deletion functionality
    deleteFile(name: string): Promise<void> {
        throw new Error("Method not implemented.")
    }

    // Placeholder for finding files with a glob pattern
    findFiles(glob: string, options?: {}): Promise<string[]> {
        throw new Error("Method not implemented.")
    }

    // Placeholder for creating a directory
    async createDirectory(name: string): Promise<void> {
        await ensureDir(name)
    }

    // Placeholder for deleting a directory
    deleteDirectory(name: string): Promise<void> {
        throw new Error("Method not implemented.")
    }

    // Placeholder for executing a shell command in a container
    exec(
        containerId: string,
        command: string,
        args: string[],
        options: ShellOptions
    ): Promise<ShellOutput> {
        throw new Error("Method not implemented.")
    }

    // Placeholder for creating a container host
    container(
        options: ContainerOptions & TraceOptions
    ): Promise<ContainerHost> {
        throw new Error("Method not implemented.")
    }

    /**
     * Instantiates a python evaluation environment
     */
    python(options?: PythonRuntimeOptions): Promise<PythonRuntime> {
        throw new Error("python")
    }

    // Async method to remove containers
    async removeContainers(): Promise<void> {}

    // Async method to remove browsers
    async removeBrowsers(): Promise<void> {}

    // Placeholder for selecting an option from a list
    select(message: string, options: string[]): Promise<string> {
        throw new Error("Method not implemented.")
    }

    // Placeholder for input functionality
    input(message: string): Promise<string> {
        throw new Error("Method not implemented.")
    }

    // Placeholder for confirmation functionality
    confirm(message: string): Promise<boolean> {
        throw new Error("Method not implemented.")
    }
}
