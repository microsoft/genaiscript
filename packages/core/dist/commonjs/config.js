"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeHostConfigs = mergeHostConfigs;
exports.readHostConfig = readHostConfig;
exports.resolveLanguageModelConfigurations = resolveLanguageModelConfigurations;
const dotenv_1 = __importDefault(require("dotenv"));
const node_os_1 = require("node:os");
const yaml_js_1 = require("./yaml.js");
const json5_js_1 = require("./json5.js");
const constants_js_1 = require("./constants.js");
const node_path_1 = require("node:path");
const schema_js_1 = require("./schema.js");
const merge_js_1 = require("./merge.js");
const lm_js_1 = require("./lm.js");
const cleaners_js_1 = require("./cleaners.js");
const error_js_1 = require("./error.js");
const configschema_js_1 = __importDefault(require("./configschema.js"));
const configjson_js_1 = __importDefault(require("./configjson.js"));
const host_js_1 = require("./host.js");
const es_toolkit_1 = require("es-toolkit");
const fs_js_1 = require("./fs.js");
const env_js_1 = require("./env.js");
const debug_js_1 = require("./debug.js");
const dbg = (0, debug_js_1.genaiscriptDebug)("config");
function mergeHostConfigs(config, parsed) {
    if (!config && !parsed)
        return undefined;
    if (!parsed)
        return config;
    return (0, cleaners_js_1.deleteEmptyValues)({
        include: (0, merge_js_1.structuralMerge)(config?.include || [], parsed?.include || []),
        envFile: [...(0, cleaners_js_1.arrayify)(parsed?.envFile), ...(0, cleaners_js_1.arrayify)(config?.envFile)],
        ignoreCurrentWorkspace: config?.ignoreCurrentWorkspace || parsed?.ignoreCurrentWorkspace,
        modelAliases: (0, merge_js_1.structuralMerge)(config?.modelAliases || {}, parsed?.modelAliases || {}),
        modelEncodings: (0, merge_js_1.structuralMerge)(config?.modelEncodings || {}, parsed?.modelEncodings || {}),
        secretScanners: (0, merge_js_1.structuralMerge)(config?.secretPatterns || {}, parsed?.secretPatterns || {}),
    });
}
async function resolveGlobalConfiguration(dotEnvPaths, hostConfig) {
    const dirs = [(0, node_os_1.homedir)()];
    if (!hostConfig.ignoreCurrentWorkspace)
        dirs.push(".");
    const exts = ["yml", "yaml", "json"];
    dbg("starting to resolve global configuration");
    // import and merge global local files
    let config = structuredClone(configjson_js_1.default);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete config["$schema"];
    dbg(`loaded defaultConfig: %O`, config);
    // merge host configuration
    if (hostConfig && Object.keys(hostConfig).length > 0) {
        dbg(`merging host configuration %O`, hostConfig);
        config = mergeHostConfigs(config, hostConfig);
    }
    for (const dir of dirs) {
        for (const ext of exts) {
            const filename = (0, node_path_1.resolve)(dir, `${constants_js_1.TOOL_ID}.config.${ext}`);
            dbg(`checking file: ${filename}`);
            const stat = await (0, fs_js_1.tryStat)(filename);
            if (!stat)
                continue;
            if (!stat.isFile()) {
                dbg(`skipping ${filename}, not a file`);
                throw new Error(`config: ${filename} is a not a file`);
            }
            const fileContent = await (0, fs_js_1.tryReadText)(filename);
            if (!fileContent) {
                dbg(`skipping ${filename}, no content`);
                continue;
            }
            dbg(`loading ${filename}`);
            const parsed = ext === "yml" || ext === "yaml" ? (0, yaml_js_1.YAMLTryParse)(fileContent) : (0, json5_js_1.JSON5TryParse)(fileContent);
            if (!parsed) {
                dbg(`failed to parse ${filename}`);
                throw new Error(`config: failed to parse ${filename}`);
            }
            dbg("validating config schema");
            const validation = (0, schema_js_1.validateJSONWithSchema)(parsed, configschema_js_1.default);
            if (validation.schemaError) {
                dbg(`validation error for ${filename}: ${validation.schemaError}`);
                throw new Error(`config: ` + validation.schemaError);
            }
            dbg(`merging parsed configuration %O`, parsed);
            config = mergeHostConfigs(config, parsed);
        }
    }
    if (process.env.GENAISCRIPT_ENV_FILE) {
        dbg(`adding env file from environment variable: '${process.env.GENAISCRIPT_ENV_FILE}'`);
        config.envFile = [...(config.envFile || []), process.env.GENAISCRIPT_ENV_FILE];
    }
    if (dotEnvPaths?.length) {
        dbg(`adding env files from CLI: '${dotEnvPaths.join(", ")}'`);
        config.envFile = [...(config.envFile || []), ...dotEnvPaths];
    }
    if (!config.envFile?.length) {
        dbg("no env files found, using defaults");
        config.envFile = [
            (0, node_path_1.join)((0, node_os_1.homedir)(), constants_js_1.DOT_ENV_GENAISCRIPT_FILENAME),
            constants_js_1.DOT_ENV_GENAISCRIPT_FILENAME,
            constants_js_1.DOT_ENV_FILENAME,
        ];
    }
    dbg("resolving env file paths");
    config.envFile = (0, es_toolkit_1.uniq)((0, cleaners_js_1.arrayify)(config.envFile).map((f) => (0, fs_js_1.expandHomeDir)((0, node_path_1.resolve)(f))));
    dbg(`resolved env files: ${config.envFile.join(", ")}`);
    return config;
}
/**
 * Reads and resolves the configuration for the host environment.
 *
 * @param dotEnvPaths - Optional array of .env file paths to consider. If provided, these paths will be prioritized.
 *
 * Steps:
 * - Calls `resolveGlobalConfiguration` to load base configurations from default paths and files.
 * - Processes specified `.env` files to load environment variables.
 * - Validates the existence and file type of each `.env` file.
 * - Loads and overrides environment variables using `dotenv`.
 * - Parses additional defaults from the current `process.env`.
 * - Ensures unique resolution of `.env` file paths.
 *
 * @returns The resolved host configuration including merged and validated settings.
 *
 * @throws An error if any provided `.env` file is invalid, unreadable, or not a file.
 */
async function readHostConfig(dotEnvPaths, hostConfig) {
    dbg(`reading configuration`);
    const config = await resolveGlobalConfiguration(dotEnvPaths, hostConfig);
    const { envFile } = config;
    for (const dotEnv of (0, cleaners_js_1.arrayify)(envFile)) {
        dbg(`.env: ${dotEnv}`);
        const stat = await (0, fs_js_1.tryStat)(dotEnv);
        if (!stat) {
            dbg(`ignored ${dotEnv}, not found`);
        }
        else {
            if (!stat.isFile()) {
                throw new Error(`.env: ${dotEnv} is not a file`);
            }
            dbg(`loading ${dotEnv}`);
            const res = dotenv_1.default.config({
                path: dotEnv,
                debug: /dotenv/.test(process.env.DEBUG),
                override: true,
            });
            if (res.error) {
                throw res.error;
            }
        }
    }
    await (0, env_js_1.parseDefaultsFromEnv)(process.env);
    return config;
}
/**
 * Resolves and outputs environment information for language model providers.
 * @param provider - Filters by specific provider. If not provided, resolves all providers.
 * @param options - Configuration options:
 *   - token - Include tokens in the output. If false, tokens are masked.
 *   - error - Include errors in the output.
 *   - models - List models for each provider if supported.
 *   - hide - Exclude hidden providers from the output.
 *   - cancellation options - Additional cancellation options.
 * @returns Sorted list of resolved language model configurations, including errors if applicable.
 * @throws An error if there is an issue retrieving or processing configurations for a provider.
 */
async function resolveLanguageModelConfigurations(provider, options) {
    const { token, error, models, hide } = options || {};
    const res = [];
    dbg("starting to resolve language model configurations");
    const runtimeHost = (0, host_js_1.resolveRuntimeHost)();
    for (const modelProvider of constants_js_1.MODEL_PROVIDERS.filter((mp) => (!provider || mp.id === provider) && (!hide || !mp.hidden))) {
        dbg(`processing model provider: ${modelProvider.id}, token: ${token}`);
        try {
            const conn = await runtimeHost.getLanguageModelConfiguration(modelProvider.id + ":*", options);
            if (conn) {
                dbg(`retrieved connection configuration for provider: ${modelProvider.id}`);
                let listError = "";
                if (models && token) {
                    dbg(`listing models for provider: ${modelProvider.id}`);
                    const lm = await (0, lm_js_1.resolveLanguageModel)(modelProvider.id);
                    if (lm.listModels) {
                        const models = await lm.listModels(conn, options);
                        if (models.ok) {
                            dbg(`successfully listed models for provider: ${modelProvider.id}`);
                            conn.models = models.models;
                        }
                        else {
                            listError = (0, error_js_1.errorMessage)(models.error) || "failed to list models";
                            dbg(`error listing models for provider ${modelProvider.id}: ${listError}`);
                        }
                    }
                }
                if (!token && conn.token)
                    conn.token = "***";
                if (!listError || error || provider) {
                    dbg(`adding resolved configuration for provider: ${modelProvider.id}`);
                    res.push((0, cleaners_js_1.deleteEmptyValues)({
                        provider: conn.provider,
                        source: conn.source,
                        base: conn.base,
                        type: conn.type,
                        models: conn.models,
                        error: listError,
                        token: conn.token,
                    }));
                }
            }
        }
        catch (e) {
            dbg(`error resolving configuration for provider ${modelProvider.id}: ${e}`);
            if (error || provider)
                res.push({
                    provider: modelProvider.id,
                    error: (0, error_js_1.errorMessage)(e),
                });
        }
    }
    dbg("returning sorted resolved configurations");
    return res.sort((l, r) => l.provider.localeCompare(r.provider));
}
//# sourceMappingURL=config.js.map