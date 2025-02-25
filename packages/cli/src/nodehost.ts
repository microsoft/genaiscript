import dotenv from "dotenv"

import { TextDecoder, TextEncoder } from "util"
import { lstat, readFile, unlink, writeFile } from "node:fs/promises"
import { ensureDir, exists, existsSync, remove } from "fs-extra"
import { resolve, dirname } from "node:path"
import { glob } from "glob"
import { debug, error, info, warn } from "./log"
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
    MODEL_PROVIDER_AZURE_OPENAI,
    SHELL_EXEC_TIMEOUT,
    AZURE_COGNITIVE_SERVICES_TOKEN_SCOPES,
    MODEL_PROVIDER_AZURE_SERVERLESS_MODELS,
    AZURE_AI_INFERENCE_TOKEN_SCOPES,
    MODEL_PROVIDER_AZURE_SERVERLESS_OPENAI,
    DOT_ENV_FILENAME,
    AZURE_MANAGEMENT_TOKEN_SCOPES,
    MODEL_PROVIDER_AZURE_AI_INFERENCE,
} from "../../core/src/constants"
import { tryReadText } from "../../core/src/fs"
import {
    ServerManager,
    UTF8Decoder,
    UTF8Encoder,
    RuntimeHost,
    setRuntimeHost,
    AzureTokenResolver,
    ModelConfigurations,
    ModelConfiguration,
    LogEvent,
} from "../../core/src/host"
import { TraceOptions } from "../../core/src/trace"
import { assert, logError, logVerbose } from "../../core/src/util"
import { parseModelIdentifier } from "../../core/src/models"
import { LanguageModel } from "../../core/src/chat"
import { errorMessage, NotSupportedError } from "../../core/src/error"
import { BrowserManager } from "./playwright"
import { shellConfirm, shellInput, shellSelect } from "./input"
import { shellQuote } from "../../core/src/shell"
import { uniq } from "es-toolkit"
import { PLimitPromiseQueue } from "../../core/src/concurrency"
import {
    LanguageModelConfiguration,
    LogLevel,
    Project,
    ResponseStatus,
} from "../../core/src/server/messages"
import { createAzureTokenResolver } from "../../core/src/azuretoken"
import {
    createAzureContentSafetyClient,
    isAzureContentSafetyClientConfigured,
} from "../../core/src/azurecontentsafety"
import { resolveGlobalConfiguration } from "../../core/src/config"
import { HostConfiguration } from "../../core/src/hostconfiguration"
import { resolveLanguageModel } from "../../core/src/lm"
import { CancellationOptions } from "../../core/src/cancellation"
import { defaultModelConfigurations } from "../../core/src/llms"
import { createPythonRuntime } from "../../core/src/pyodide"
import { ci } from "./ci"

class NodeServerManager implements ServerManager {
    async start(): Promise<void> {
        throw new Error("not implement")
    }
    async close(): Promise<void> {
        throw new Error("not implement")
    }
}

export class NodeHost extends EventTarget implements RuntimeHost {
    private pulledModels: string[] = []
    readonly dotEnvPath: string
    project: Project
    userState: any = {}
    readonly path = createNodePath()
    readonly server = new NodeServerManager()
    readonly workspace = createFileSystem()
    readonly containers = new DockerManager()
    readonly browsers = new BrowserManager()
    private readonly _modelAliases: Record<
        "default" | "cli" | "env" | "config" | "script",
        Omit<ModelConfigurations, "large" | "small" | "vision" | "embeddings">
    > = {
        default: defaultModelConfigurations(),
        cli: {},
        env: {},
        script: {},
        config: {},
    }
    private _config: HostConfiguration
    readonly userInputQueue = new PLimitPromiseQueue(1)
    readonly azureToken: AzureTokenResolver
    readonly azureAIInferenceToken: AzureTokenResolver
    readonly azureManagementToken: AzureTokenResolver
    readonly microsoftGraphToken: AzureTokenResolver

    constructor(dotEnvPath: string) {
        super()
        this.dotEnvPath = dotEnvPath
        this.azureToken = createAzureTokenResolver(
            "Azure OpenAI",
            "AZURE_OPENAI_TOKEN_SCOPES",
            AZURE_COGNITIVE_SERVICES_TOKEN_SCOPES
        )
        this.azureAIInferenceToken = createAzureTokenResolver(
            "Azure AI Serverless",
            "AZURE_SERVERLESS_OPENAI_TOKEN_SCOPES",
            AZURE_AI_INFERENCE_TOKEN_SCOPES
        )
        this.azureManagementToken = createAzureTokenResolver(
            "Azure Management",
            "AZURE_MANAGEMENT_TOKEN_SCOPES",
            AZURE_MANAGEMENT_TOKEN_SCOPES
        )
        this.microsoftGraphToken = createAzureTokenResolver(
            "Microsoft Graph",
            "MICROSOFT_GRAPH_TOKEN_SCOPES",
            ["https://graph.microsoft.com/.default"]
        )
    }

    get modelAliases(): Readonly<ModelConfigurations> {
        const res = {
            ...this._modelAliases.default,
            ...this._modelAliases.config,
            ...this._modelAliases.script,
            ...this._modelAliases.env,
            ...this._modelAliases.cli,
        } as ModelConfigurations
        return Object.freeze(res)
    }

    clearModelAlias(source: "cli" | "env" | "config" | "script") {
        this._modelAliases[source] = {}
    }

    setModelAlias(
        source: "cli" | "env" | "config" | "script",
        id: string,
        value: string | ModelConfiguration
    ): void {
        id = id.toLowerCase()
        if (typeof value === "string") value = { model: value, source }
        const aliases = this._modelAliases[source]
        const c = aliases[id] || (aliases[id] = { source })
        if (value === undefined || value.model === id) delete aliases[id]
        else if (value.model !== undefined && value.model !== id)
            (c as any).model = value.model
        if (!isNaN(value.temperature))
            (c as any).temperature = value.temperature
        if (value.reasoningEffort)
            (c as any).reasoningEffort = value.reasoningEffort
        if (value.fallbackTools) (c as any).fallbackTools = value.fallbackTools
    }

    async pullModel(
        cfg: LanguageModelConfiguration,
        options?: TraceOptions & CancellationOptions
    ): Promise<ResponseStatus> {
        const { trace } = options
        const { provider, model } = cfg
        const modelId = `${provider}:${model}`
        if (this.pulledModels.includes(modelId)) return { ok: true }

        const { pullModel, listModels } = await resolveLanguageModel(provider)
        if (!pullModel) {
            this.pulledModels.includes(modelId)
            return { ok: true }
        }

        if (listModels) {
            const { ok, status, error, models } = await listModels(cfg, options)
            if (!ok) {
                logError(`${provider}: ${errorMessage(error)}`)
                trace?.error(`${provider}: ${errorMessage(error)}`, error)
                return { ok, status, error }
            }
            if (models.find(({ id }) => id === model)) {
                this.pulledModels.push(modelId)
                return { ok: true }
            }
        }

        const res = await pullModel(cfg, options)
        if (res.ok) this.pulledModels.push(modelId)
        else if (res.error) {
            logError(`${provider}: ${errorMessage(res.error)}`)
            trace?.error(`${provider}: ${errorMessage(error)}`, error)
        }
        return res
    }

    async readConfig(): Promise<HostConfiguration> {
        const config = await resolveGlobalConfiguration(this.dotEnvPath)
        const { envFile, modelAliases } = config
        if (modelAliases)
            for (const kv of Object.entries(modelAliases))
                this.setModelAlias("config", kv[0], kv[1])
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
        await parseDefaultsFromEnv(process.env)
        return (this._config = config)
    }

    get config() {
        assert(!!this._config, "Host configuration not loaded")
        return this._config
    }

    static async install(dotEnvPath?: string) {
        const h = new NodeHost(dotEnvPath)
        setRuntimeHost(h)
        await h.readConfig()
        return h
    }

    async readSecret(name: string): Promise<string | undefined> {
        return process.env[name]
    }

    clientLanguageModel: LanguageModel

    async getLanguageModelConfiguration(
        modelId: string,
        options?: { token?: boolean } & CancellationOptions & TraceOptions
    ): Promise<LanguageModelConfiguration> {
        const { token: askToken, trace } = options || {}
        const tok = await parseTokenFromEnv(process.env, modelId)
        if (!askToken && tok?.token) tok.token = "***"
        if (askToken && tok && !tok.token) {
            if (
                tok.provider === MODEL_PROVIDER_AZURE_OPENAI ||
                tok.provider === MODEL_PROVIDER_AZURE_SERVERLESS_OPENAI
            ) {
                const { token: azureToken, error: azureTokenError } =
                    await this.azureToken.token(
                        tok.azureCredentialsType,
                        options
                    )
                if (!azureToken) {
                    if (azureTokenError) {
                        logError(
                            `Azure OpenAI token not available for ${modelId}`
                        )
                        logVerbose(azureTokenError.message)
                        trace.error(
                            `Azure OpenAI token not available for ${modelId}`,
                            azureTokenError
                        )
                    }
                    throw new Error(
                        `Azure OpenAI token not available for ${modelId}`
                    )
                }
                tok.token = "Bearer " + azureToken.token
            } else if (
                tok.provider === MODEL_PROVIDER_AZURE_AI_INFERENCE ||
                tok.provider === MODEL_PROVIDER_AZURE_SERVERLESS_MODELS
            ) {
                const { token: azureToken, error: azureTokenError } =
                    await this.azureAIInferenceToken.token(
                        tok.azureCredentialsType,
                        options
                    )
                if (!azureToken) {
                    if (azureTokenError) {
                        logError(
                            `Azure AI Inference token not available for ${modelId}`
                        )
                        logVerbose(azureTokenError.message)
                        trace.error(
                            `Azure AI Inference token not available for ${modelId}`,
                            azureTokenError
                        )
                    }
                    throw new Error(
                        `Azure AI Inference token not available for ${modelId}`
                    )
                }
                if (tok.provider === MODEL_PROVIDER_AZURE_AI_INFERENCE)
                    tok.token = azureToken.token
                else tok.token = "Bearer " + azureToken.token
            }
        }
        if (tok && (!tok.token || tok.token === tok.provider)) {
            const { listModels } = await resolveLanguageModel(tok.provider)
            if (listModels) {
                const { ok, error } = await listModels(tok, options)
                if (!ok)
                    throw new Error(`${tok.provider}: ${errorMessage(error)}`)
            }
        }
        if (!tok) {
            if (!modelId)
                throw new Error(
                    "Could not determine default model from current configuration"
                )
            const { provider } = parseModelIdentifier(modelId)
            if (provider === MODEL_PROVIDER_AZURE_OPENAI)
                throw new Error(`Azure OpenAI not configured for ${modelId}`)
            else if (provider === MODEL_PROVIDER_AZURE_AI_INFERENCE)
                throw new Error(
                    `Azure AI Inference not configured for ${modelId}`
                )
            else if (provider === MODEL_PROVIDER_AZURE_SERVERLESS_OPENAI)
                throw new Error(
                    `Azure AI OpenAI Serverless not configured for ${modelId}`
                )
            else if (provider === MODEL_PROVIDER_AZURE_SERVERLESS_MODELS)
                throw new Error(`Azure AI Models not configured for ${modelId}`)
        }

        return tok
    }

    log(level: LogLevel, msg: string): void {
        if (msg === undefined) return
        this.dispatchEvent(new LogEvent(level, msg))
        switch (level) {
            case "error":
                error(msg)
                break
            case "warn":
                warn(msg)
                break
            case "debug":
                debug(msg)
                break
            case "info":
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
    async readFile(filepath: string): Promise<Uint8Array> {
        const wksrx = /^workspace:\/\//i
        if (wksrx.test(filepath))
            filepath = join(this.projectFolder(), filepath.replace(wksrx, ""))
        // check if file exists
        if (!(await exists(filepath))) return undefined
        // read file
        const res = await readFile(filepath)
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

    /**
     * Instantiates a python evaluation environment
     */
    python(
        options?: PythonRuntimeOptions & TraceOptions
    ): Promise<PythonRuntime> {
        return createPythonRuntime(options)
    }

    async exec(
        containerId: string,
        command: string,
        args: string[],
        options: ShellOptions & TraceOptions & CancellationOptions
    ) {
        if (containerId) {
            const container = await this.containers.container(containerId)
            return await container.exec(command, args, options)
        }

        const {
            label,
            cwd,
            timeout = SHELL_EXEC_TIMEOUT,
            cancellationToken,
            stdin: input,
        } = options || {}
        const trace = options?.trace?.startTraceDetails(label || command)
        try {
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
                    cancellationToken,
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
    async select(
        message: string,
        options: string[]
    ): Promise<string | undefined> {
        if (ci.isCI) return undefined
        return await this.userInputQueue.add(() =>
            shellSelect(message, options)
        )
    }

    /**
     * Asks the user to input a text
     * @param message message to ask
     */
    async input(message: string): Promise<string | undefined> {
        if (ci.isCI) return undefined
        return await this.userInputQueue.add(() => shellInput(message))
    }

    /**
     * Asks the user to confirm a message
     * @param message message to ask
     */
    async confirm(message: string): Promise<boolean | undefined> {
        if (ci.isCI) return undefined
        return await this.userInputQueue.add(() => shellConfirm(message))
    }
}
