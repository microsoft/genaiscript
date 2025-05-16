import debug from "debug"
const dbg = debug("genaiscript:nodehost")

import { TextDecoder, TextEncoder } from "util"
import { lstat, mkdir, readFile, unlink, writeFile } from "node:fs/promises"
import { ensureDir, exists, remove } from "fs-extra"
import { dirname } from "node:path"
import { glob } from "glob"
import { debug as debug_, error, info, warn } from "./log"
import { execa } from "execa"
import { join } from "node:path"
import { createNodePath } from "../../core/src/path"
import { DockerManager } from "./docker"
import { createWorkspaceFileSystem } from "../../core/src/workspace"
import { filterGitIgnore } from "../../core/src/gitignore"
import { parseTokenFromEnv } from "../../core/src/env"
import {
    MODEL_PROVIDER_AZURE_OPENAI,
    SHELL_EXEC_TIMEOUT,
    AZURE_COGNITIVE_SERVICES_TOKEN_SCOPES,
    MODEL_PROVIDER_AZURE_SERVERLESS_MODELS,
    AZURE_AI_INFERENCE_TOKEN_SCOPES,
    MODEL_PROVIDER_AZURE_SERVERLESS_OPENAI,
    AZURE_MANAGEMENT_TOKEN_SCOPES,
    MODEL_PROVIDER_AZURE_AI_INFERENCE,
    NEGATIVE_GLOB_REGEX,
} from "../../core/src/constants"
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
import { readConfig } from "../../core/src/config"
import { HostConfiguration } from "../../core/src/hostconfiguration"
import { resolveLanguageModel } from "../../core/src/lm"
import { CancellationOptions } from "../../core/src/cancellation"
import { defaultModelConfigurations } from "../../core/src/llms"
import { createPythonRuntime } from "../../core/src/pyodide"
import { ci } from "../../core/src/ci"
import { arrayify } from "../../core/src/cleaners"
import { McpClientManager } from "../../core/src/mcpclient"
import { ResourceManager } from "../../core/src/mcpresource"
import { providerFeatures } from "../../core/src/features"

class NodeServerManager implements ServerManager {
    async start(): Promise<void> {
        dbg(`starting NodeServerManager`)
        throw new Error("not implement")
    }
    async close(): Promise<void> {
        dbg(`closing NodeServerManager`)
        throw new Error("not implement")
    }
}

export class NodeHost extends EventTarget implements RuntimeHost {
    private pulledModels: string[] = []
    readonly _dotEnvPaths: string[]
    project: Project
    userState: any = {}
    readonly path = createNodePath()
    readonly server = new NodeServerManager()
    readonly workspace = createWorkspaceFileSystem()
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
    readonly azureAIServerlessToken: AzureTokenResolver
    readonly azureManagementToken: AzureTokenResolver
    readonly microsoftGraphToken: AzureTokenResolver
    readonly mcp: McpClientManager
    readonly resources: ResourceManager

    constructor(dotEnvPaths: string[]) {
        dbg(`initializing NodeHost with dotEnvPaths: ${dotEnvPaths}`)
        super()
        this._dotEnvPaths = dotEnvPaths
        this.azureToken = createAzureTokenResolver(
            "Azure OpenAI",
            "AZURE_OPENAI_TOKEN_SCOPES",
            AZURE_COGNITIVE_SERVICES_TOKEN_SCOPES
        )
        this.azureAIInferenceToken = createAzureTokenResolver(
            "Azure AI Inference",
            "AZURE_AI_INFERENCE_TOKEN_SCOPES",
            AZURE_COGNITIVE_SERVICES_TOKEN_SCOPES
        )
        this.azureAIServerlessToken = createAzureTokenResolver(
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
        this.mcp = new McpClientManager()
        this.resources = new ResourceManager()
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
        dbg(`clearing modelAlias for source: ${source}`)
        this._modelAliases[source] = {}
    }

    setModelAlias(
        source: "cli" | "env" | "config" | "script",
        id: string,
        value: string | ModelConfiguration
    ): void {
        id = id.toLowerCase()
        if (typeof value === "string") {
            value = { model: value, source }
        }
        const aliases = this._modelAliases[source]
        const c = aliases[id] || (aliases[id] = { source })
        if (value === undefined || value.model === id) {
            dbg(`alias ${id}: deleting (source: ${source})`)
            delete aliases[id]
        } else if (value.model !== undefined && value.model !== id) {
            dbg(`alias: ${id}.model = ${value.model} (source: ${source})`)
            ;(c as any).model = value.model
        }
        if (!isNaN(value.temperature)) {
            dbg(
                `alias: ${id}.temperature = ${value.temperature} (source: ${source})`
            )
            ;(c as any).temperature = value.temperature
        }
        if (value.reasoningEffort) {
            dbg(
                `alias: ${id}.reasoning effort = ${value.reasoningEffort} (source: ${source})`
            )
            ;(c as any).reasoningEffort = value.reasoningEffort
        }
        if (value.fallbackTools) {
            dbg(
                `alias: ${id}.fallback tools = ${value.fallbackTools} (source: ${source})`
            )
            ;(c as any).fallbackTools = value.fallbackTools
        }
    }

    async pullModel(
        cfg: LanguageModelConfiguration,
        options?: TraceOptions & CancellationOptions
    ): Promise<ResponseStatus> {
        const { trace } = options
        const { provider, model } = cfg
        const modelId = `${provider}:${model}`
        if (this.pulledModels.includes(modelId)) {
            return { ok: true }
        }

        const { pullModel, listModels } = await resolveLanguageModel(provider)
        if (!pullModel) {
            this.pulledModels.includes(modelId)
            return { ok: true }
        }

        if (listModels) {
            dbg(`listing models for provider: ${provider}`)
            const { ok, status, error, models } = await listModels(cfg, options)
            if (!ok) {
                logError(`${provider}: ${errorMessage(error)}`)
                trace?.error(`${provider}: ${errorMessage(error)}`, error)
                return { ok, status, error }
            }
            if (models.find(({ id }) => id === model)) {
                dbg(`found model ${model} in provider ${provider}, skip pull`)
                this.pulledModels.push(modelId)
                return { ok: true }
            }
        }

        dbg(`pulling model: ${model} from provider: ${provider}`)
        const res = await pullModel(cfg, options)
        if (res?.ok) {
            this.pulledModels.push(modelId)
        } else if (res?.error) {
            logError(`${provider}: ${errorMessage(res.error)}`)
            trace?.error(`${provider}: ${errorMessage(error)}`, error)
        }
        return res
    }

    async readConfig(): Promise<HostConfiguration> {
        dbg(`reading configuration`)
        this._config = await readConfig(this._dotEnvPaths)
        const { modelAliases } = this._config
        if (modelAliases) {
            for (const kv of Object.entries(modelAliases)) {
                this.setModelAlias("config", kv[0], kv[1])
            }
        }
        return this._config
    }

    get config() {
        assert(!!this._config, "Host configuration not loaded")
        return this._config
    }

    static async install(dotEnvPaths?: string[]) {
        const h = new NodeHost(dotEnvPaths)
        setRuntimeHost(h)
        await h.readConfig()
        return h
    }

    async readSecret(name: string): Promise<string | undefined> {
        dbg(`reading secret: ${name}`)
        return process.env[name]
    }

    clientLanguageModel: LanguageModel

    async getLanguageModelConfiguration(
        modelId: string,
        options?: { token?: boolean } & CancellationOptions & TraceOptions
    ): Promise<LanguageModelConfiguration> {
        const { token: askToken, trace, cancellationToken } = options || {}
        const tok = await parseTokenFromEnv(process.env, modelId, {
            resolveToken: askToken,
            trace,
            cancellationToken,
        })
        if (!askToken && tok?.token) {
            tok.token = "***"
        }
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
                    const providerName = providerFeatures(tok.provider)?.detail
                    if (azureTokenError) {
                        logError(
                            `${providerName} token not available for ${modelId}, ${tok.azureCredentialsType || "default"}`
                        )
                        logVerbose(azureTokenError.message)
                        trace?.error(
                            `${providerName} token not available for ${modelId}, ${tok.azureCredentialsType || "default"}`,
                            azureTokenError
                        )
                    }
                    throw new Error(
                        `${providerName} token not available for ${modelId}`
                    )
                }
                tok.token = "Bearer " + azureToken.token
            } else if (tok.provider === MODEL_PROVIDER_AZURE_AI_INFERENCE) {
                const { token: azureToken, error: azureTokenError } =
                    await this.azureAIInferenceToken.token(
                        tok.azureCredentialsType,
                        options
                    )
                if (!azureToken) {
                    if (azureTokenError) {
                        logError(
                            `Azure AI Inference token not available for ${modelId}, ${tok.azureCredentialsType || "default"}`
                        )
                        logVerbose(azureTokenError.message)
                        trace?.error(
                            `Azure AI Inference token not available for ${modelId}, ${tok.azureCredentialsType || "default"}`,
                            azureTokenError
                        )
                    }
                    throw new Error(
                        `Azure AI Inference token not available for ${modelId}`
                    )
                }
                tok.token = "Bearer " + azureToken.token
            } else if (
                tok.provider === MODEL_PROVIDER_AZURE_SERVERLESS_MODELS
            ) {
                const { token: azureToken, error: azureTokenError } =
                    await this.azureAIServerlessToken.token(
                        tok.azureCredentialsType,
                        options
                    )
                if (!azureToken) {
                    if (azureTokenError) {
                        logError(
                            `Azure AI Serverless token not available for ${modelId}`
                        )
                        logVerbose(azureTokenError.message)
                        trace?.error(
                            `Azure AI Serverless token not available for ${modelId}`,
                            azureTokenError
                        )
                    }
                    throw new Error(
                        `Azure AI Serverless token not available for ${modelId}`
                    )
                }
                tok.token = "Bearer " + azureToken.token
            }
        }
        if (tok && (!tok.token || tok.token === tok.provider)) {
            const { listModels } = await resolveLanguageModel(tok.provider)
            if (listModels) {
                dbg(`listing models for provider: ${tok.provider}`)
                const { ok, error } = await listModels(tok, options)
                if (!ok) {
                    dbg(`error listing models: ${errorMessage(error)}`)
                    throw new Error(`${tok.provider}: ${errorMessage(error)}`)
                }
            }
        }
        if (!tok) {
            if (!modelId) {
                dbg(`no token found for modelId: ${modelId}`)
                throw new Error(
                    "Could not determine default model from current configuration"
                )
            }
            const { provider } = parseModelIdentifier(modelId)
            if (provider === MODEL_PROVIDER_AZURE_OPENAI) {
                throw new Error(`Azure OpenAI not configured for ${modelId}`)
            } else if (provider === MODEL_PROVIDER_AZURE_AI_INFERENCE) {
                throw new Error(
                    `Azure AI Inference not configured for ${modelId}`
                )
            } else if (provider === MODEL_PROVIDER_AZURE_SERVERLESS_OPENAI) {
                throw new Error(
                    `Azure AI OpenAI Serverless not configured for ${modelId}`
                )
            } else if (provider === MODEL_PROVIDER_AZURE_SERVERLESS_MODELS) {
                throw new Error(`Azure AI Models not configured for ${modelId}`)
            }
        }

        if (tok) {
            dbg(`resolved token for ${modelId}: %O`, {
                ...tok,
                token: tok.token ? "***" : undefined,
            })
        } else dbg(`no token found for ${modelId}`)
        return tok
    }

    log(level: LogLevel, msg: string): void {
        if (msg === undefined) {
            return
        }
        this.dispatchEvent(new LogEvent(level, msg))
        switch (level) {
            case "error":
                error(msg)
                break
            case "warn":
                warn(msg)
                break
            case "debug":
                debug_(msg)
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
        dbg(`reading file: ${filepath}`)
        const wksrx = /^workspace:\/\//i
        if (wksrx.test(filepath)) {
            filepath = join(this.projectFolder(), filepath.replace(wksrx, ""))
        }
        // check if file exists
        if (!(await exists(filepath))) {
            dbg(`file does not exist: ${filepath}`)
            return undefined
        }
        // read file
        const res = await readFile(filepath)
        return res ? new Uint8Array(res) : new Uint8Array()
    }
    async findFiles(
        path: ElementOrArray<string>,
        options: {
            ignore?: ElementOrArray<string>
            applyGitIgnore?: boolean
        }
    ): Promise<string[]> {
        const { ignore, applyGitIgnore } = options || {}
        const paths = arrayify(path).filter((p) => !!p)
        dbg(`finding files: ${paths}`)
        const negatives = paths
            .filter((p) => NEGATIVE_GLOB_REGEX.test(p))
            .map((p) => p.replace(NEGATIVE_GLOB_REGEX, ""))
        const positives = paths.filter((p) => !NEGATIVE_GLOB_REGEX.test(p))
        let files = await glob(positives, {
            nodir: true,
            windowsPathsNoEscape: true,
            ignore: uniq([...arrayify(ignore), ...negatives]),
            dot: true,
        })
        if (applyGitIgnore !== false) {
            files = await filterGitIgnore(files)
        }
        const res = uniq(files)
        dbg(`found files: %d\n%O`, res.length, res)
        return res
    }
    async writeFile(name: string, content: Uint8Array): Promise<void> {
        await ensureDir(dirname(name))
        await writeFile(name, content)
    }
    async deleteFile(name: string) {
        await unlink(name)
    }
    async createDirectory(name: string): Promise<void> {
        await mkdir(name, { recursive: true })
    }
    async deleteDirectory(name: string): Promise<void> {
        await remove(name)
    }

    async contentSafety(
        id?: "azure",
        options?: TraceOptions & CancellationOptions
    ): Promise<ContentSafety> {
        if (!id && isAzureContentSafetyClientConfigured()) {
            id = "azure"
        }
        if (id === "azure") {
            const safety = createAzureContentSafetyClient(options)
            return safety
        } else if (id) {
            throw new NotSupportedError(`content safety ${id} not supported`)
        }
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
            dbg(`executing command: ${command} with args: ${args}`)
            return await container.exec(command, args, options)
        }

        const {
            label,
            cwd,
            timeout = SHELL_EXEC_TIMEOUT,
            cancellationToken,
            stdin: input,
            ignoreError,
            env,
            isolateEnv,
        } = options || {}
        const trace = options?.trace?.startTraceDetails(label || command)
        try {
            // python3 on windows -> python
            if (command === "python3" && process.platform === "win32") {
                dbg(`adjusting python command for Windows`)
                command = "python"
            }
            if (command === "python" && process.platform !== "win32") {
                command = "python3"
            }

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
                    env,
                    extendEnv: !isolateEnv,
                }
            )
            trace?.itemValue(`exit code`, `${exitCode}`)
            if (stdout) {
                trace?.detailsFenced(`📩 stdout`, stdout)
            }
            if (stderr) {
                trace?.detailsFenced(`📩 stderr`, stderr)
            }
            return { stdout, stderr, exitCode, failed }
        } catch (err) {
            if (!ignoreError) {
                trace?.error("exec failed", err)
            }
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
        dbg(`removing all containers`)
        await this.containers.stopAndRemove()
    }

    async removeBrowsers(): Promise<void> {
        dbg(`removing all browsers`)
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
        if (ci.isCI) {
            return undefined
        }
        return await this.userInputQueue.add(() =>
            shellSelect(message, options)
        )
    }

    /**
     * Asks the user to input a text
     * @param message message to ask
     */
    async input(message: string): Promise<string | undefined> {
        dbg(`input requested for message: ${message}`)
        if (ci.isCI) {
            return undefined
        }
        return await this.userInputQueue.add(() => shellInput(message))
    }

    /**
     * Asks the user to confirm a message
     * @param message message to ask
     */
    async confirm(message: string): Promise<boolean | undefined> {
        dbg(`confirmation requested for message: ${message}`)
        if (ci.isCI) {
            return undefined
        }
        return await this.userInputQueue.add(() => shellConfirm(message))
    }
}
