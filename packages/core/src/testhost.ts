// This module defines a TestHost class that implements the RuntimeHost interface.
// It provides various functionalities related to language models, file operations, and other utilities.
// Tags: RuntimeHost, TestHost, LanguageModel, FileSystem, Node.js

// Import necessary modules and functions from various files
import { readFile, writeFile } from "fs/promises"
import { ensureDir } from "fs-extra"
import {
    LogLevel,
    ModelService,
    LanguageModelConfiguration,
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
import { LanguageModel } from "./chat"
import { Project } from "./ast"

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
    // Path to the dotenv file (if used)
    dotEnvPath: string = undefined
    // State object to store user-specific data
    userState: any = {}
    // Service to manage language models
    models: ModelService
    // Server management service
    server: ServerManager
    // Instance of the path utility
    path: Path = createNodePath()
    // File system for workspace
    workspace: WorkspaceFileSystem

    // Default options for language models
    readonly defaultModelOptions = {
        model: DEFAULT_MODEL,
        temperature: DEFAULT_TEMPERATURE,
    }
    // Default options for embeddings models
    readonly defaultEmbeddingsModelOptions = {
        embeddingsModel: DEFAULT_EMBEDDINGS_MODEL,
    }

    // Static method to set this class as the runtime host
    static install() {
        setRuntimeHost(new TestHost())
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
        throw new Error("Method not implemented.")
    }

    // Method to read a file and return its content as a Uint8Array
    async readFile(name: string): Promise<Uint8Array> {
        return new Uint8Array(await readFile(resolve(name)))
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
