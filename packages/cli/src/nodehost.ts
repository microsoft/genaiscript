import dotenv from "dotenv"

import { TextDecoder, TextEncoder } from "util"
import { lstat, readFile, unlink, writeFile } from "node:fs/promises"
import { ensureDir, exists, existsSync, remove } from "fs-extra"
import { resolve, dirname } from "node:path"
import { glob } from "glob"
import { debug, error, info, isQuiet, warn } from "./log"
import { execa } from "execa"
import { join } from "node:path"
import { createNodePath } from "./nodepath"
import { DockerManager } from "./docker"
import { createFileSystem } from "../../core/src/filesystem"
import { filterGitIgnore } from "../../core/src/gitignore"
import {
    parseDefaultsFromEnv,
    parseTokenFromEnv,
} from "../../core/src/connection"
import {
    DEFAULT_MODEL,
    DEFAULT_TEMPERATURE,
    MODEL_PROVIDER_AZURE_OPENAI,
    SHELL_EXEC_TIMEOUT,
    MODEL_PROVIDER_OLLAMA,
    TOOL_ID,
    DEFAULT_EMBEDDINGS_MODEL,
    DEFAULT_SMALL_MODEL,
    AZURE_COGNITIVE_SERVICES_TOKEN_SCOPES,
    MODEL_PROVIDER_AZURE_SERVERLESS_MODELS,
    AZURE_AI_INFERENCE_TOKEN_SCOPES,
    MODEL_PROVIDER_AZURE_SERVERLESS_OPENAI,
    DOT_ENV_FILENAME,
} from "../../core/src/constants"
import { tryReadText } from "../../core/src/fs"
import {
    ServerManager,
    ModelService,
    LanguageModelConfiguration,
    LogLevel,
    UTF8Decoder,
    UTF8Encoder,
    RuntimeHost,
    setRuntimeHost,
    ResponseStatus,
    AzureTokenResolver,
} from "../../core/src/host"
import { AbortSignalOptions, TraceOptions } from "../../core/src/trace"
import { logError, logVerbose } from "../../core/src/util"
import { parseModelIdentifier } from "../../core/src/models"
import { LanguageModel } from "../../core/src/chat"
import {
    errorMessage,
    NotSupportedError,
    serializeError,
} from "../../core/src/error"
import { BrowserManager } from "./playwright"
import { shellConfirm, shellInput, shellSelect } from "./input"
import { shellQuote } from "../../core/src/shell"
import { uniq } from "es-toolkit"
import { PLimitPromiseQueue } from "../../core/src/concurrency"
import { Project } from "../../core/src/ast"
import { createAzureTokenResolver } from "./azuretoken"
import {
    createAzureContentSafetyClient,
    isAzureContentSafetyClientConfigured,
} from "../../core/src/azurecontentsafety"
import { resolveGlobalConfiguration } from "../../core/src/config"
import { HostConfiguration } from "../../core/src/hostconfiguration"

class NodeServerManager implements ServerManager {
    async start(): Promise<void> {
        throw new Error("not implement")
    }
    async close(): Promise<void> {
        throw new Error("not implement")
    }
}

class ModelManager implements ModelService {
    private pulled: string[] = []

    constructor(private readonly host: RuntimeHost) {}
    private async getModelToken(modelId: string) {
        const { provider } = parseModelIdentifier(modelId)
        const conn = await this.host.getLanguageModelConfiguration(modelId)
        if (provider === MODEL_PROVIDER_OLLAMA)
            conn.base = conn.base.replace(/\/v1$/i, "")
        return conn
    }

    async pullModel(
        modelid: string,
        options?: TraceOptions
    ): Promise<ResponseStatus> {
        const { trace } = options || {}
        const { provider, model } = parseModelIdentifier(modelid)
        if (provider === MODEL_PROVIDER_OLLAMA) {
            if (this.pulled.includes(modelid)) return { ok: true }

            if (!isQuiet) logVerbose(`ollama pull ${model}`)
            try {
                const conn = await this.getModelToken(modelid)
                const res = await fetch(`${conn.base}/api/pull`, {
                    method: "POST",
                    headers: {
                        "User-Agent": TOOL_ID,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(
                        { name: model, stream: false },
                        null,
                        2
                    ),
                })
                if (res.ok) {
                    const resp = await res.json()
                }
                if (res.ok) this.pulled.push(modelid)
                return { ok: res.ok, status: res.status }
            } catch (e) {
                logError(`failed to pull model ${model}`)
                trace?.error("pull model failed", e)
                return { ok: false, status: 500, error: serializeError(e) }
            }
        }

        return { ok: true }
    }
}

export class NodeHost implements RuntimeHost {
    readonly config: HostConfiguration
    project: Project
    userState: any = {}
    models: ModelService
    readonly path = createNodePath()
    readonly server = new NodeServerManager()
    readonly workspace = createFileSystem()
    readonly containers = new DockerManager()
    readonly browsers = new BrowserManager()
    readonly defaultModelOptions = {
        model: DEFAULT_MODEL,
        smallModel: DEFAULT_SMALL_MODEL,
        temperature: DEFAULT_TEMPERATURE,
    }
    readonly defaultEmbeddingsModelOptions = {
        embeddingsModel: DEFAULT_EMBEDDINGS_MODEL,
    }
    readonly userInputQueue = new PLimitPromiseQueue(1)
    readonly azureToken: AzureTokenResolver
    readonly azureServerlessToken: AzureTokenResolver

    constructor(config: HostConfiguration) {
        this.config = config
        this.models = new ModelManager(this)
        this.azureToken = createAzureTokenResolver(
            "Azure",
            "AZURE_OPENAI_TOKEN_SCOPES",
            AZURE_COGNITIVE_SERVICES_TOKEN_SCOPES
        )
        this.azureServerlessToken = createAzureTokenResolver(
            "Azure AI Serverless",
            "AZURE_SERVERLESS_OPENAI_TOKEN_SCOPES",
            AZURE_AI_INFERENCE_TOKEN_SCOPES
        )
    }

    private async syncDotEnv() {
        const { envFile } = this.config
        if (existsSync(envFile)) {
            if (resolve(envFile) !== resolve(DOT_ENV_FILENAME))
                logVerbose(`.env: loading ${envFile}`)
            const res = dotenv.config({
                path: envFile,
                debug: !!process.env.DEBUG,
                override: true,
            })
            if (res.error) throw res.error
        }
    }

    static async install(dotEnvPath: string) {
        const config = await resolveGlobalConfiguration(dotEnvPath)
        const h = new NodeHost(config)
        setRuntimeHost(h)
        await h.parseDefaults()
        return h
    }

    async readSecret(name: string): Promise<string | undefined> {
        return process.env[name]
    }

    private async parseDefaults() {
        await this.syncDotEnv()
        await parseDefaultsFromEnv(process.env)
    }
    clientLanguageModel: LanguageModel

    async getLanguageModelConfiguration(
        modelId: string,
        options?: { token?: boolean } & AbortSignalOptions & TraceOptions
    ): Promise<LanguageModelConfiguration> {
        const { signal, token: askToken } = options || {}
        const tok = await parseTokenFromEnv(process.env, modelId)
        if (!askToken && tok?.token) tok.token = "***"
        if (askToken && tok && !tok.token) {
            if (
                tok.provider === MODEL_PROVIDER_AZURE_OPENAI ||
                tok.provider === MODEL_PROVIDER_AZURE_SERVERLESS_OPENAI
            ) {
                const azureToken = await this.azureToken.token(
                    tok.azureCredentialsType,
                    options
                )
                if (!azureToken)
                    throw new Error("Azure OpenAI token not available")
                tok.token = "Bearer " + azureToken.token
            } else if (
                tok.provider === MODEL_PROVIDER_AZURE_SERVERLESS_MODELS
            ) {
                const azureToken = await this.azureServerlessToken.token(
                    tok.azureCredentialsType,
                    options
                )
                if (!azureToken) throw new Error("Azure AI token not available")
                tok.token = "Bearer " + azureToken.token
            }
        }
        if (!tok) {
            if (!modelId)
                throw new Error(
                    "could not determine default model from current configuration"
                )
            const { provider } = parseModelIdentifier(modelId)
            if (provider === MODEL_PROVIDER_AZURE_OPENAI)
                throw new Error("Azure OpenAI not configured")
            else if (provider === MODEL_PROVIDER_AZURE_SERVERLESS_OPENAI)
                throw new Error("Azure AI OpenAI Serverless not configured")
            else if (provider === MODEL_PROVIDER_AZURE_SERVERLESS_MODELS)
                throw new Error("Azure AI Models not configured")
        }
        if (!tok && this.clientLanguageModel) {
            return <LanguageModelConfiguration>{
                model: modelId,
                provider: this.clientLanguageModel.id,
                source: "client",
            }
        }

        return tok
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
        return this.path.resolve(".")
    }
    installFolder(): string {
        return this.projectFolder()
    }
    resolvePath(...segments: string[]) {
        return this.path.resolve(...segments)
    }
    async statFile(name: string): Promise<{
        size: number
        type: "file" | "directory" | "symlink"
    }> {
        try {
            const stats = await lstat(name)
            return {
                size: stats.size,
                type: stats.isFile()
                    ? "file"
                    : stats.isDirectory()
                      ? "directory"
                      : stats.isSymbolicLink()
                        ? "symlink"
                        : undefined,
            }
        } catch (error) {
            return undefined
        }
    }
    async readFile(name: string): Promise<Uint8Array> {
        const wksrx = /^workspace:\/\//i
        if (wksrx.test(name))
            name = join(this.projectFolder(), name.replace(wksrx, ""))
        // check if file exists
        if (!(await exists(name))) return undefined
        // read file
        const res = await readFile(name)
        return res ? new Uint8Array(res) : new Uint8Array()
    }
    async findFiles(
        path: string | string[],
        options: {
            ignore?: string | string[]
            applyGitIgnore?: boolean
        }
    ): Promise<string[]> {
        const { ignore, applyGitIgnore } = options || {}
        let files = await glob(path, {
            nodir: true,
            windowsPathsNoEscape: true,
            ignore,
        })
        if (applyGitIgnore) {
            const gitignore = await tryReadText(".gitignore")
            files = await filterGitIgnore(gitignore, files)
        }
        return uniq(files)
    }
    async writeFile(name: string, content: Uint8Array): Promise<void> {
        await ensureDir(dirname(name))
        await writeFile(name, content)
    }
    async deleteFile(name: string) {
        await unlink(name)
    }
    async createDirectory(name: string): Promise<void> {
        await ensureDir(name)
    }
    async deleteDirectory(name: string): Promise<void> {
        await remove(name)
    }

    async contentSafety(
        id?: "azure",
        options?: TraceOptions
    ): Promise<ContentSafety> {
        if (!id && isAzureContentSafetyClientConfigured()) id = "azure"
        if (id === "azure") {
            const safety = createAzureContentSafetyClient(options)
            return safety
        } else if (id)
            throw new NotSupportedError(`content safety ${id} not supported`)
        return undefined
    }

    async browse(
        url: string,
        options?: BrowseSessionOptions & TraceOptions
    ): Promise<BrowserPage> {
        return this.browsers.browse(url, options)
    }

    async exec(
        containerId: string,
        command: string,
        args: string[],
        options: ShellOptions & TraceOptions
    ) {
        if (containerId) {
            const container = await this.containers.container(containerId)
            return await container.exec(command, args, options)
        }

        const {
            trace,
            label,
            cwd,
            timeout = SHELL_EXEC_TIMEOUT,
            stdin: input,
        } = options || {}
        try {
            trace?.startDetails(label || command)

            // python3 on windows -> python
            if (command === "python3" && process.platform === "win32")
                command = "python"
            if (command === "python" && process.platform !== "win32")
                command = "python3"

            const cmd = shellQuote([command, ...args])
            logVerbose(`${cwd ? `${cwd}> ` : ""}${cmd}`)
            trace?.itemValue(`cwd`, cwd)
            trace?.item(cmd)

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
                    stdin: input ? undefined : "ignore",
                    stdout: ["pipe"],
                    stderr: ["pipe"],
                }
            )
            trace?.itemValue(`exit code`, `${exitCode}`)
            if (stdout) trace?.detailsFenced(`📩 stdout`, stdout)
            if (stderr) trace?.detailsFenced(`📩 stderr`, stderr)
            return { stdout, stderr, exitCode, failed }
        } catch (err) {
            trace?.error("exec failed", err)
            return {
                stdout: "",
                stderr: errorMessage(err),
                exitCode: 1,
                failed: true,
            }
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
        return await this.containers.startContainer(options)
    }

    async removeContainers(): Promise<void> {
        await this.containers.stopAndRemove()
    }

    async removeBrowsers(): Promise<void> {
        await this.browsers.stopAndRemove()
    }

    /**
     * Asks the user to select between options
     * @param message question to ask
     * @param options options to select from
     */
    async select(message: string, options: string[]): Promise<string> {
        return await this.userInputQueue.add(() =>
            shellSelect(message, options)
        )
    }

    /**
     * Asks the user to input a text
     * @param message message to ask
     */
    async input(message: string): Promise<string> {
        return await this.userInputQueue.add(() => shellInput(message))
    }

    /**
     * Asks the user to confirm a message
     * @param message message to ask
     */
    async confirm(message: string): Promise<boolean> {
        return await this.userInputQueue.add(() => shellConfirm(message))
    }
}
