import dotenv from "dotenv"
import prompts from "prompts"
import {
    AskUserOptions,
    Host,
    LanguageModelConfiguration,
    LogLevel,
    ModelService,
    ReadFileOptions,
    RetrievalService,
    SHELL_EXEC_TIMEOUT,
    ServerManager,
    TraceOptions,
    UTF8Decoder,
    UTF8Encoder,
    createBundledParsers,
    createFileSystem,
    parseTokenFromEnv,
    setHost,
} from "genaiscript-core"
import { TextDecoder, TextEncoder } from "util"
import { readFile, unlink, writeFile } from "node:fs/promises"
import { ensureDir, existsSync, remove } from "fs-extra"
import { resolve, dirname } from "node:path"
import { glob } from "glob"
import { debug, error, info, warn } from "./log"
import { execa } from "execa"
import { join } from "node:path"
import { LlamaIndexRetrievalService } from "./llamaindexretrieval"
import { createNodePath } from "./nodepath"
import { DockerManager } from "./docker"

class NodeServerManager implements ServerManager {
    async start(): Promise<void> {
        throw new Error("not implement")
    }
    async close(): Promise<void> {
        throw new Error("not implement")
    }
}

export class NodeHost implements Host {
    userState: any = {}
    virtualFiles: Record<string, Uint8Array> = {}
    retrieval: RetrievalService
    models: ModelService
    readonly path = createNodePath()
    readonly server = new NodeServerManager()
    readonly workspace = createFileSystem()
    readonly parser = createBundledParsers()
    readonly docker = new DockerManager()

    constructor() {
        const srv = new LlamaIndexRetrievalService(this)
        this.retrieval = srv
        this.models = srv
    }

    static install(dotEnvPath: string) {
        dotEnvPath = dotEnvPath || resolve(".env")
        if (existsSync(dotEnvPath)) {
            const res = dotenv.config({
                path: dotEnvPath,
                debug: !!process.env.DEBUG,
                override: true,
            })
            if (res.error) throw res.error
        }
        const h = new NodeHost()
        setHost(h)
        return h
    }

    async readSecret(name: string): Promise<string | undefined> {
        return process.env[name]
    }

    async getLanguageModelConfiguration(
        modelId: string
    ): Promise<LanguageModelConfiguration> {
        return await parseTokenFromEnv(process.env, modelId)
    }

    clearVirtualFiles(): void {
        this.virtualFiles = {}
    }

    setVirtualFile(name: string, content: string) {
        this.virtualFiles[resolve(name)] =
            this.createUTF8Encoder().encode(content)
    }
    isVirtualFile(name: string) {
        return !!this.virtualFiles[name]
    }

    log(level: LogLevel, msg: string): void {
        if (msg === undefined) return
        switch (level) {
            case LogLevel.Error:
                error(msg)
                break
            case LogLevel.Warn:
                warn(msg)
                break
            case LogLevel.Verbose:
                debug(msg)
                break
            case LogLevel.Info:
            default:
                info(msg)
                break
        }
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
        return this.projectFolder()
    }
    resolvePath(...segments: string[]) {
        return resolve(...segments)
    }
    async askUser(options: AskUserOptions) {
        const res = await prompts({
            type: "text",
            name: "value",
            message: options.prompt,
        })
        return res?.value
    }
    async readFile(
        name: string,
        options?: ReadFileOptions
    ): Promise<Uint8Array> {
        const wksrx = /^workspace:\/\//i
        if (wksrx.test(name))
            name = join(this.projectFolder(), name.replace(wksrx, ""))

        // virtual file handler
        const v = this.virtualFiles[resolve(name)]
        if (options?.virtual) {
            if (!v) throw new Error("virtual file not found")
            return v // alway return virtual files
        } else if (options?.virtual !== false && !!v) return v // optional return virtual files

        // read file
        const res = await readFile(name)
        return res ? new Uint8Array(res) : new Uint8Array()
    }
    async findFiles(
        path: string | string[],
        ignore?: string | string[]
    ): Promise<string[]> {
        const files = await glob(path, {
            nodir: true,
            windowsPathsNoEscape: true,
            ignore,
        })
        return files
    }
    async writeFile(name: string, content: Uint8Array): Promise<void> {
        await ensureDir(dirname(name))
        delete this.virtualFiles[resolve(name)]
        await writeFile(name, content)
    }
    async deleteFile(name: string) {
        delete this.virtualFiles[resolve(name)]
        await unlink(name)
    }
    async createDirectory(name: string): Promise<void> {
        await ensureDir(name)
    }

    async deleteDirectory(name: string): Promise<void> {
        await remove(name)
    }

    async exec(
        containerId: string,
        command: string,
        args: string[],
        options: ShellOptions & TraceOptions
    ) {
        if (containerId) {
            const container = await this.docker.container(containerId)
            return await container.exec(command, args, options)
        }

        const {
            trace,
            label,
            cwd,
            timeout = SHELL_EXEC_TIMEOUT,
            stdin: input,
        } = options
        try {
            trace?.startDetails(label || command)

            // python3 on windows -> python
            if (command === "python3" && process.platform === "win32")
                command = "python"
            if (command === "python" && process.platform !== "win32")
                command = "python3"

            trace?.itemValue(`cwd`, cwd)
            trace?.item(`\`${command}\` ${args.join(" ")}`)

            const { stdout, stderr, exitCode, failed } = await execa(
                command,
                args,
                {
                    cleanup: true,
                    input,
                    timeout,
                    cwd,
                    preferLocal: true,
                    stripFinalNewline: true,
                }
            )
            trace?.itemValue(`exit code`, `${exitCode}`)
            if (stdout) trace?.detailsFenced(`📩 stdout`, stdout)
            if (stderr) trace?.detailsFenced(`📩 stderr`, stderr)
            return { stdout, stderr, exitCode, failed }
        } finally {
            trace?.endDetails()
        }
    }

    /**
     * Starts a container to execute sandboxed code
     * @param options
     */
    async container(
        options: ContainerOptions & TraceOptions
    ): Promise<ContainerHost> {
        return await this.docker.startContainer(options)
    }

    async removeContainers(): Promise<void> {
        await this.docker.stopAndRemove()
    }
}
