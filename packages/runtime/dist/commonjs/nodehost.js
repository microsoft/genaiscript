"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeHost = void 0;
const promises_1 = require("node:fs/promises");
const core_1 = require("@genaiscript/core");
const node_path_1 = require("node:path");
const glob_1 = require("glob");
const log_js_1 = require("./log.js");
const execa_1 = require("execa");
const node_path_2 = require("node:path");
const core_2 = require("@genaiscript/core");
const docker_js_1 = require("./docker.js");
const es_toolkit_1 = require("es-toolkit");
const input_js_1 = require("./input.js");
const core_3 = require("@genaiscript/core");
const dbg = (0, core_2.genaiscriptDebug)("host:node");
class NodeServerManager {
    async start() {
        dbg(`starting NodeServerManager`);
        throw new Error("not implement");
    }
    async close() {
        dbg(`closing NodeServerManager`);
        throw new Error("not implement");
    }
}
class NodeHost extends EventTarget {
    pulledModels = [];
    _dotEnvPaths;
    _hostConfig = {};
    project;
    userState = {};
    path = (0, core_2.createNodePath)();
    server = new NodeServerManager();
    workspace = (0, core_2.createWorkspaceFileSystem)();
    containers = new docker_js_1.DockerManager();
    _modelAliases = {
        default: (0, core_2.defaultModelConfigurations)(),
        cli: {},
        env: {},
        script: {},
        config: {},
    };
    _config;
    userInputQueue = new core_2.PLimitPromiseQueue(1);
    azureToken;
    azureAIInferenceToken;
    azureAIServerlessToken;
    azureManagementToken;
    microsoftGraphToken;
    mcp;
    resources;
    constructor(dotEnvPaths) {
        dbg(`initializing NodeHost with dotEnvPaths: ${dotEnvPaths}`);
        super();
        this._dotEnvPaths = dotEnvPaths;
        this.azureToken = (0, core_2.createAzureTokenResolver)("Azure OpenAI", "AZURE_OPENAI_TOKEN_SCOPES", core_2.AZURE_COGNITIVE_SERVICES_TOKEN_SCOPES);
        this.azureAIInferenceToken = (0, core_2.createAzureTokenResolver)("Azure AI Inference", "AZURE_AI_INFERENCE_TOKEN_SCOPES", core_2.AZURE_COGNITIVE_SERVICES_TOKEN_SCOPES);
        this.azureAIServerlessToken = (0, core_2.createAzureTokenResolver)("Azure AI Serverless", "AZURE_SERVERLESS_OPENAI_TOKEN_SCOPES", core_2.AZURE_AI_INFERENCE_TOKEN_SCOPES);
        this.azureManagementToken = (0, core_2.createAzureTokenResolver)("Azure Management", "AZURE_MANAGEMENT_TOKEN_SCOPES", core_2.AZURE_MANAGEMENT_TOKEN_SCOPES);
        this.microsoftGraphToken = (0, core_2.createAzureTokenResolver)("Microsoft Graph", "MICROSOFT_GRAPH_TOKEN_SCOPES", ["https://graph.microsoft.com/.default"]);
        this.mcp = new core_2.McpClientManager();
        this.resources = new core_2.ResourceManager();
    }
    get hostConfig() {
        return this._hostConfig;
    }
    get modelAliases() {
        const res = {
            ...this._modelAliases.default,
            ...this._modelAliases.config,
            ...this._modelAliases.script,
            ...this._modelAliases.env,
            ...this._modelAliases.cli,
        };
        return Object.freeze(res);
    }
    updateHostConfig(config) {
        this._hostConfig = (0, core_2.mergeHostConfigs)(this._hostConfig, config);
        dbg(`updated host configuration %O`, this._hostConfig);
        this._config = undefined;
    }
    clearModelAlias(source) {
        dbg(`clearing modelAlias for source: ${source}`);
        this._modelAliases[source] = {};
    }
    setModelAlias(source, id, value) {
        id = id.toLowerCase();
        const dangerousKeys = ["__proto__", "prototype", "constructor"];
        if (dangerousKeys.includes(id)) {
            throw new Error("Invalid key");
        }
        if (typeof value === "string") {
            value = { model: value, source };
        }
        const aliases = this._modelAliases[source];
        const c = aliases[id] || (aliases[id] = { source });
        if (value === undefined || value.model === id) {
            dbg(`alias ${id}: deleting (source: ${source})`);
            delete aliases[id];
        }
        else if (value.model !== undefined && value.model !== id) {
            dbg(`alias: ${id}.model = ${value.model} (source: ${source})`);
            c.model = value.model;
        }
        if (!isNaN(value.temperature)) {
            dbg(`alias: ${id}.temperature = ${value.temperature} (source: ${source})`);
            c.temperature = value.temperature;
        }
        if (value.reasoningEffort) {
            dbg(`alias: ${id}.reasoning effort = ${value.reasoningEffort} (source: ${source})`);
            c.reasoningEffort = value.reasoningEffort;
        }
        if (value.fallbackTools) {
            dbg(`alias: ${id}.fallback tools = ${value.fallbackTools} (source: ${source})`);
            c.fallbackTools = value.fallbackTools;
        }
    }
    async pullModel(cfg, options) {
        const { trace } = options;
        const { provider, model } = cfg;
        const modelId = `${provider}:${model}`;
        if (this.pulledModels.includes(modelId)) {
            return { ok: true };
        }
        const { pullModel, listModels } = await (0, core_2.resolveLanguageModel)(provider);
        if (!pullModel) {
            this.pulledModels.includes(modelId);
            return { ok: true };
        }
        if (listModels) {
            dbg(`listing models for provider: ${provider}`);
            const { ok, status, error, models } = await listModels(cfg, options);
            if (!ok) {
                (0, core_2.logError)(`${provider}: ${(0, core_2.errorMessage)(error)}`);
                trace?.error(`${provider}: ${(0, core_2.errorMessage)(error)}`, error);
                return { ok, status, error };
            }
            if (models.find((other) => (0, core_3.areModelsSame)(other.id, model))) {
                dbg(`found model ${model} in provider ${provider}, skip pull`);
                this.pulledModels.push(modelId);
                return { ok: true };
            }
        }
        dbg(`pulling model: ${model} from provider: ${provider}`);
        const res = await pullModel(cfg, options);
        if (res?.ok) {
            this.pulledModels.push(modelId);
        }
        else if (res?.error) {
            (0, core_2.logError)(`${provider}: ${(0, core_2.errorMessage)(res.error)}`);
            trace?.error(`${provider}: ${(0, core_2.errorMessage)(log_js_1.error)}`, log_js_1.error);
        }
        return res;
    }
    async readConfig() {
        dbg(`reading configuration`);
        this._config = await (0, core_2.readHostConfig)(this._dotEnvPaths, this._hostConfig);
        const { modelAliases } = this._config;
        if (modelAliases) {
            for (const kv of Object.entries(modelAliases)) {
                this.setModelAlias("config", kv[0], kv[1]);
            }
        }
        return this._config;
    }
    get config() {
        (0, core_2.assert)(!!this._config, "Host configuration not loaded");
        return this._config;
    }
    static async install(dotEnvPaths, hostConfig) {
        dbg(`installing %o`, dotEnvPaths);
        const h = new NodeHost(dotEnvPaths ? (0, core_2.arrayify)(dotEnvPaths) : undefined);
        (0, core_2.setRuntimeHost)(h);
        if (hostConfig)
            h.updateHostConfig(hostConfig);
        await h.readConfig();
        return h;
    }
    async readSecret(name) {
        dbg(`reading secret: ${name}`);
        return process.env[name];
    }
    clientLanguageModel;
    async getLanguageModelConfiguration(modelId, options) {
        const { token: askToken, trace, cancellationToken } = options || {};
        const tok = await (0, core_2.parseTokenFromEnv)(process.env, modelId, {
            resolveToken: askToken,
            trace,
            cancellationToken,
        });
        if (!askToken && tok?.token) {
            tok.token = "***";
        }
        if (askToken && tok && !tok.token) {
            if (tok.provider === core_2.MODEL_PROVIDER_AZURE_OPENAI ||
                tok.provider === core_2.MODEL_PROVIDER_AZURE_SERVERLESS_OPENAI) {
                const { token: azureToken, error: azureTokenError } = await this.azureToken.token(tok.azureCredentialsType, options);
                if (!azureToken) {
                    const providerName = (0, core_2.providerFeatures)(tok.provider)?.detail;
                    if (azureTokenError) {
                        (0, core_2.logError)(`${providerName} token not available for ${modelId}, ${tok.azureCredentialsType || "default"}`);
                        (0, core_2.logVerbose)(azureTokenError.message);
                        trace?.error(`${providerName} token not available for ${modelId}, ${tok.azureCredentialsType || "default"}`, azureTokenError);
                    }
                    throw new Error(`${providerName} token not available for ${modelId}`);
                }
                tok.token = "Bearer " + azureToken.token;
            }
            else if (tok.provider === core_2.MODEL_PROVIDER_AZURE_AI_INFERENCE) {
                const { token: azureToken, error: azureTokenError } = await this.azureAIInferenceToken.token(tok.azureCredentialsType, options);
                if (!azureToken) {
                    if (azureTokenError) {
                        (0, core_2.logError)(`Azure AI Inference token not available for ${modelId}, ${tok.azureCredentialsType || "default"}`);
                        (0, core_2.logVerbose)(azureTokenError.message);
                        trace?.error(`Azure AI Inference token not available for ${modelId}, ${tok.azureCredentialsType || "default"}`, azureTokenError);
                    }
                    throw new Error(`Azure AI Inference token not available for ${modelId}`);
                }
                tok.token = "Bearer " + azureToken.token;
            }
            else if (tok.provider === core_2.MODEL_PROVIDER_AZURE_SERVERLESS_MODELS) {
                const { token: azureToken, error: azureTokenError } = await this.azureAIServerlessToken.token(tok.azureCredentialsType, options);
                if (!azureToken) {
                    if (azureTokenError) {
                        (0, core_2.logError)(`Azure AI Serverless token not available for ${modelId}`);
                        (0, core_2.logVerbose)(azureTokenError.message);
                        trace?.error(`Azure AI Serverless token not available for ${modelId}`, azureTokenError);
                    }
                    throw new Error(`Azure AI Serverless token not available for ${modelId}`);
                }
                tok.token = "Bearer " + azureToken.token;
            }
        }
        if (tok && (!tok.token || tok.token === tok.provider)) {
            const { listModels } = await (0, core_2.resolveLanguageModel)(tok.provider);
            if (listModels) {
                dbg(`listing models for provider: ${tok.provider}`);
                const { ok, error } = await listModels(tok, options);
                if (!ok) {
                    dbg(`error listing models: ${(0, core_2.errorMessage)(error)}`);
                    throw new Error(`${tok.provider}: ${(0, core_2.errorMessage)(error)}`);
                }
            }
        }
        if (!tok) {
            if (!modelId) {
                dbg(`no token found for modelId: ${modelId}`);
                throw new Error("Could not determine default model from current configuration");
            }
            const { provider } = (0, core_2.parseModelIdentifier)(modelId);
            if (provider === core_2.MODEL_PROVIDER_AZURE_OPENAI) {
                throw new Error(`Azure OpenAI not configured for ${modelId}`);
            }
            else if (provider === core_2.MODEL_PROVIDER_AZURE_AI_INFERENCE) {
                throw new Error(`Azure AI Inference not configured for ${modelId}`);
            }
            else if (provider === core_2.MODEL_PROVIDER_AZURE_SERVERLESS_OPENAI) {
                throw new Error(`Azure AI OpenAI Serverless not configured for ${modelId}`);
            }
            else if (provider === core_2.MODEL_PROVIDER_AZURE_SERVERLESS_MODELS) {
                throw new Error(`Azure AI Models not configured for ${modelId}`);
            }
        }
        if (tok) {
            dbg(`resolved token for ${modelId}: %O`, {
                ...tok,
                token: tok.token ? "***" : undefined,
            });
        }
        else
            dbg(`no token found for ${modelId}`);
        return tok;
    }
    log(level, msg) {
        if (msg === undefined) {
            return;
        }
        this.dispatchEvent(new core_2.LogEvent(level, msg));
        switch (level) {
            case "error":
                (0, log_js_1.error)(msg);
                break;
            case "warn":
                (0, log_js_1.warn)(msg);
                break;
            case "debug":
                (0, log_js_1.debug)(msg);
                break;
            case "info":
            default:
                (0, log_js_1.info)(msg);
                break;
        }
    }
    projectFolder() {
        return this.path.resolve(".");
    }
    resolvePath(...segments) {
        return this.path.resolve(...segments);
    }
    async statFile(name) {
        try {
            const stats = await (0, promises_1.lstat)(name);
            return {
                size: stats.size,
                type: stats.isFile()
                    ? "file"
                    : stats.isDirectory()
                        ? "directory"
                        : stats.isSymbolicLink()
                            ? "symlink"
                            : undefined,
            };
        }
        catch {
            return undefined;
        }
    }
    async readFile(filepath) {
        dbg(`reading file: ${filepath}`);
        const wksrx = /^workspace:\/\//i;
        if (wksrx.test(filepath)) {
            filepath = (0, node_path_2.join)(this.projectFolder(), filepath.replace(wksrx, ""));
        }
        // check if file exists
        if (!(await (0, core_1.fileExists)(filepath))) {
            dbg(`file does not exist: ${filepath}`);
            return undefined;
        }
        // read file
        const res = await (0, promises_1.readFile)(filepath);
        return res ? new Uint8Array(res) : new Uint8Array();
    }
    async findFiles(path, options) {
        const { ignore, applyGitIgnore } = options || {};
        const paths = (0, core_2.arrayify)(path).filter((p) => !!p);
        dbg(`finding files: ${paths}`);
        const negatives = paths
            .filter((p) => core_2.NEGATIVE_GLOB_REGEX.test(p))
            .map((p) => p.replace(core_2.NEGATIVE_GLOB_REGEX, ""));
        const positives = paths.filter((p) => !core_2.NEGATIVE_GLOB_REGEX.test(p));
        const globOptions = {
            nodir: true,
            windowsPathsNoEscape: true,
            ignore: (0, es_toolkit_1.uniq)([...(0, core_2.arrayify)(ignore), ...negatives]),
            dot: true,
        };
        dbg(`glob: %O`, globOptions);
        let files = await (0, glob_1.glob)(positives, globOptions);
        if (applyGitIgnore !== false) {
            dbg(`applying .gitignore`);
            files = await (0, core_2.filterGitIgnore)(files);
        }
        const res = (0, es_toolkit_1.uniq)(files);
        dbg(`found files: %d\n%O`, res.length, res);
        return res;
    }
    async writeFile(name, content) {
        await (0, core_1.ensureDir)((0, node_path_1.dirname)(name));
        await (0, promises_1.writeFile)(name, content);
    }
    async deleteFile(name) {
        await (0, promises_1.unlink)(name);
    }
    async createDirectory(name) {
        await (0, promises_1.mkdir)(name, { recursive: true });
    }
    async deleteDirectory(name) {
        await (0, promises_1.rm)(name, { recursive: true });
    }
    async contentSafety(id, options) {
        if (!id && (0, core_2.isAzureContentSafetyClientConfigured)()) {
            id = "azure";
        }
        if (id === "azure") {
            const safety = (0, core_2.createAzureContentSafetyClient)(options);
            return safety;
        }
        else if (id) {
            throw new core_2.NotSupportedError(`content safety ${id} not supported`);
        }
        return undefined;
    }
    async exec(containerId, command, args, options) {
        if (containerId) {
            const container = await this.containers.container(containerId);
            dbg(`executing command: ${command} with args: ${args}`);
            return await container.exec(command, args, options);
        }
        const { label, cwd, timeout = core_2.SHELL_EXEC_TIMEOUT, cancellationToken, stdin: input, ignoreError, env, isolateEnv, } = options || {};
        const trace = options?.trace?.startTraceDetails(label || command);
        try {
            // python3 on windows -> python
            if (command === "python3" && process.platform === "win32") {
                dbg(`adjusting python command for Windows`);
                command = "python";
            }
            if (command === "python" && process.platform !== "win32") {
                command = "python3";
            }
            const cmd = (0, core_2.shellQuote)([command, ...args]);
            (0, core_2.logVerbose)(`${cwd ? `${cwd}> ` : ""}${cmd}`);
            trace?.itemValue(`cwd`, cwd);
            trace?.item(cmd);
            const { stdout, stderr, exitCode, failed } = await (0, execa_1.execa)(command, args, {
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
            });
            trace?.itemValue(`exit code`, `${exitCode}`);
            if (stdout) {
                trace?.detailsFenced(`📩 stdout`, stdout);
            }
            if (stderr) {
                trace?.detailsFenced(`📩 stderr`, stderr);
            }
            return { stdout, stderr, exitCode, failed };
        }
        catch (err) {
            if (!ignoreError) {
                trace?.error("exec failed", err);
            }
            return {
                stdout: "",
                stderr: (0, core_2.errorMessage)(err),
                exitCode: 1,
                failed: true,
            };
        }
        finally {
            trace?.endDetails();
        }
    }
    /**
     * Starts a container to execute sandboxed code
     * @param options
     */
    async container(options) {
        return this.containers.startContainer(options);
    }
    async removeContainers() {
        dbg(`removing all containers`);
        await this.containers.stopAndRemove();
    }
    /**
     * Asks the user to select between options
     * @param message question to ask
     * @param options options to select from
     */
    async select(message, options) {
        if (core_2.ci.isCI) {
            return undefined;
        }
        return await this.userInputQueue.add(() => (0, input_js_1.shellSelect)(message, options));
    }
    /**
     * Asks the user to input a text
     * @param message message to ask
     */
    async input(message) {
        dbg(`input requested for message: ${message}`);
        if (core_2.ci.isCI) {
            return undefined;
        }
        return await this.userInputQueue.add(() => (0, input_js_1.shellInput)(message));
    }
    /**
     * Asks the user to confirm a message
     * @param message message to ask
     */
    async confirm(message) {
        dbg(`confirmation requested for message: ${message}`);
        if (core_2.ci.isCI) {
            return undefined;
        }
        return await this.userInputQueue.add(() => (0, input_js_1.shellConfirm)(message));
    }
}
exports.NodeHost = NodeHost;
//# sourceMappingURL=nodehost.js.map