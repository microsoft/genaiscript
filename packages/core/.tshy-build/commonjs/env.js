"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.ollamaParseHostVariable = ollamaParseHostVariable;
exports.findEnvVar = findEnvVar;
exports.parseDefaultsFromEnv = parseDefaultsFromEnv;
exports.parseTokenFromEnv = parseTokenFromEnv;
const cleaners_js_1 = require("./cleaners.js");
const constants_js_1 = require("./constants.js");
const host_js_1 = require("./host.js");
const models_js_1 = require("./models.js");
const cleaners_js_2 = require("./cleaners.js");
const node_url_1 = require("node:url");
const url_js_1 = require("./url.js");
const debug_js_1 = require("./debug.js");
const yaml_js_1 = require("./yaml.js");
const dbg = (0, debug_js_1.genaiscriptDebug)("config:env");
/**
 * Parses the OLLAMA host environment variable and returns a standardized URL.
 *
 * @param env - The environment variables object to extract OLLAMA-related settings.
 * @returns The resolved OLLAMA host URL.
 *
 * The function prioritizes the following environment variables to determine the host:
 * - OLLAMA_HOST
 * - OLLAMA_API_BASE
 * - Fallback to the constant OLLAMA_API_BASE.
 *
 * If the resolved value matches an IP address or "localhost" with an optional port,
 * it constructs a URL with the default port if not provided. Otherwise, it validates
 * and returns a complete URL. Throws an error if the URL is invalid.
 */
function ollamaParseHostVariable(env) {
    dbg(`ollamaParseHostVariable called with env: ${JSON.stringify(env)}`);
    const s = (env.OLLAMA_HOST || env.OLLAMA_API_BASE || constants_js_1.OLLAMA_API_BASE)?.trim();
    const ipm = /^(?<address>(localhost|\d+\.\d+\.\d+\.\d+))(:(?<port>\d+))?$/i.exec(s);
    if (ipm) {
        return `http://${ipm.groups.address}:${ipm.groups.port || constants_js_1.OLLAMA_DEFAULT_PORT}`;
    }
    const url = new node_url_1.URL(s);
    return url.href;
}
/**
 * Finds an environment variable based on provided prefixes and names.
 *
 * @param env - The environment variables as key-value pairs.
 * @param prefixes - A string or array of strings representing the possible prefixes for the variable name.
 * @param names - An array of variable names to match against the prefixes.
 * @returns An object containing the matched variable name and its value, or undefined if no match is found.
 */
function findEnvVar(env, prefixes, names) {
    for (const prefix of (0, cleaners_js_2.arrayify)(prefixes)) {
        for (const name of names) {
            const pname = prefix + name;
            const value = env[pname] || env[pname.toLowerCase()] || env[pname.toUpperCase()];
            if (value !== undefined) {
                return { name: pname, value };
            }
        }
    }
    return undefined;
}
/**
 * Parses default configuration values from the provided environment variables.
 *
 * This function extracts default model configurations and temperature settings
 * based on environment variable values and sets them as runtime model aliases.
 * Legacy and new configurations are supported.
 *
 * @param env - An object representing environment variables with keys and values.
 *   - GENAISCRIPT_DEFAULT_MODEL: Specifies the default model for the "large" alias.
 *   - GENAISCRIPT_DEFAULT_TEMPERATURE: Sets the default temperature for the model, if defined.
 *   - GENAISCRIPT_DEFAULT_[ID]_MODEL or GENAISCRIPT_MODEL_[ID]: Configures aliases for specific model IDs.
 */
async function parseDefaultsFromEnv(env) {
    const runtimeHost = (0, host_js_1.resolveRuntimeHost)();
    dbg(`parsing process.env`);
    // legacy
    if (env.GENAISCRIPT_DEFAULT_MODEL) {
        dbg(`found GENAISCRIPT_DEFAULT_MODEL: ${env.GENAISCRIPT_DEFAULT_MODEL}`);
        runtimeHost.setModelAlias("env", "large", env.GENAISCRIPT_DEFAULT_MODEL);
    }
    // action
    if (env.INPUT_MODEL) {
        dbg(`found INPUT_MODEL = ${env.INPUT_MODEL}`);
        runtimeHost.setModelAlias("env", "large", env.INPUT_MODEL);
    }
    const rx = /^(GENAISCRIPT(_DEFAULT)?|INPUT)_MODEL_(?<id>[A-Z0-9_-]+)$/i;
    const entries = Object.entries(env);
    dbg(`envs: %O`, Object.keys(env));
    for (const kv of entries) {
        const [k, v] = kv;
        const m = rx.exec(k);
        if (!m) {
            continue;
        }
        const id = m.groups.id.toLowerCase();
        dbg(`found %s -> %s = %s`, k, id, v);
        if (id === "alias") {
            // special handling for alias, try to parse as YAML, INI
            const aliases = (0, yaml_js_1.YAMLTryParse)(v.trim());
            dbg(`parsed aliases: ${JSON.stringify(aliases)}`);
            if (aliases && typeof aliases === "object") {
                for (const [alias, model] of Object.entries(aliases)) {
                    if (typeof model === "string")
                        runtimeHost.setModelAlias("env", alias, model);
                }
            }
        }
        else
            runtimeHost.setModelAlias("env", id, v);
    }
    const t = (0, cleaners_js_1.normalizeFloat)(env.GENAISCRIPT_DEFAULT_TEMPERATURE);
    if (!isNaN(t)) {
        dbg(`parsed GENAISCRIPT_DEFAULT_TEMPERATURE = ${t}`);
        runtimeHost.setModelAlias("env", "large", { temperature: t });
    }
}
function parseModelApiVersion(provider, model) {
    const name = `GENAISCRIPT_API_VERSION_${provider.toUpperCase()}_${model.toUpperCase()}`;
    const inputName = `INPUT_API_VERSION_${provider.toUpperCase()}_${model.toUpperCase()}`;
    return process.env[name] ?? process.env[inputName];
}
/**
 * Parses the environment variables to retrieve the necessary token, base URL, and configuration details
 * for a specified model identifier based on its provider.
 *
 * @param env - A record of environment variables, serving as the source for token and API configuration.
 * @param modelId - The identifier of the model for which the token and configuration details are to be parsed.
 * @param options - Additional options for tracing, cancellation, and token resolution.
 *
 * @returns A promise that resolves to a configuration object containing the provider, model, token, base URL,
 *          type, version, and source, or undefined if no matching configuration is found.
 *
 * Notes:
 * - Handles several model providers, including OpenAI, Azure OpenAI, Azure Serverless OpenAI, Azure AI Inference, Azure Serverless Models, Anthropic, Google, HuggingFace, and more.
 * - Throws errors if mandatory variables like API keys or bases are not configured.
 * - Includes validation checks for URL formats and supported provider types.
 */
async function parseTokenFromEnv(env, modelId, options) {
    const { resolveToken } = options || {};
    const runtimeHost = (0, host_js_1.resolveRuntimeHost)();
    const { provider, model, tag } = (0, models_js_1.parseModelIdentifier)(modelId ?? runtimeHost.modelAliases.large.model);
    dbg(`parsing token for '%s:%s:%s'`, provider, model, tag || "");
    const TOKEN_SUFFIX = ["_API_KEY", "_API_TOKEN", "_TOKEN", "_KEY"];
    const BASE_SUFFIX = ["_API_BASE", "_API_ENDPOINT", "_BASE", "_ENDPOINT"];
    if (provider === constants_js_1.MODEL_PROVIDER_OPENAI) {
        dbg(`processing ${constants_js_1.MODEL_PROVIDER_OPENAI}`);
        const token = env.OPENAI_API_KEY ?? "";
        let base = env.OPENAI_API_BASE;
        const type = env.OPENAI_API_TYPE || "openai";
        const version = parseModelApiVersion(provider, model) ||
            env.OPENAI_API_VERSION ||
            parseAzureVersionFromUrl(base);
        if (type !== "azure" &&
            type !== "openai" &&
            type !== "localai" &&
            type !== "azure_serverless" &&
            type !== "azure_serverless_models") {
            throw new Error("OPENAI_API_TYPE must be 'azure', 'azure_serverless', 'azure_serverless_models' or 'openai' or 'localai'");
        }
        if (type === "openai" && !base) {
            dbg(`setting default base for OPENAI_API_TYPE openai`);
            base = constants_js_1.OPENAI_API_BASE;
        }
        if (type === "localai" && !base) {
            base = constants_js_1.LOCALAI_API_BASE;
        }
        if ((type === "azure" || type === "azure_serverless") && !base) {
            throw new Error("OPENAI_API_BASE must be set when type is 'azure'");
        }
        if (type === "azure") {
            base = cleanAzureBase(base);
        }
        if (!token && !/^http:\/\//i.test(base)) {
            // localhost typically requires no key
            throw new Error("OPENAI_API_KEY missing");
        }
        if (token === constants_js_1.PLACEHOLDER_API_KEY) {
            throw new Error("OPENAI_API_KEY not configured");
        }
        if (base === constants_js_1.PLACEHOLDER_API_BASE) {
            throw new Error("OPENAI_API_BASE not configured");
        }
        if (base && !node_url_1.URL.canParse(base)) {
            throw new Error("OPENAI_API_BASE must be a valid URL");
        }
        return {
            provider,
            model,
            modelId,
            base,
            type,
            token,
            source: "env: OPENAI_API_...",
            version,
        };
    }
    if (provider === constants_js_1.MODEL_PROVIDER_GITHUB) {
        dbg(`processing ${constants_js_1.MODEL_PROVIDER_GITHUB}`);
        const res = findEnvVar(env, "", ["GITHUB_MODELS_TOKEN", ...constants_js_1.GITHUB_TOKENS]) || {
            name: undefined,
            value: undefined,
        };
        if (!res?.value) {
            if (resolveToken) {
                const { exitCode, stdout, stderr } = await runtimeHost.exec(undefined, "gh", ["auth", "token"], options);
                if (exitCode !== 0) {
                    dbg(`gh auth token: %s`, stderr);
                }
                else {
                    res.name = "gh auth token";
                    res.value = stdout.trim();
                }
            }
            if (!res?.value)
                throw new Error("GitHub authentication required. Please set GITHUB_MODELS_TOKEN, GITHUB_TOKEN, or GH_TOKEN environment variable, or run 'gh auth login' to authenticate with GitHub CLI.");
        }
        const org = findEnvVar(env, "", ["GITHUB_MODELS_ORG"]);
        const type = "github";
        const base = org ? `https://models.github.ai/orgs/${org}/inference/` : constants_js_1.GITHUB_MODELS_BASE;
        dbg(`base: %s`, base);
        return {
            provider,
            model,
            modelId,
            base,
            token: res.value,
            type,
            source: `env: ${res.name}`,
        };
    }
    if (provider === constants_js_1.MODEL_PROVIDER_AZURE_OPENAI) {
        dbg(`processing ${constants_js_1.MODEL_PROVIDER_AZURE_OPENAI}`);
        const tokenVar = env.AZURE_OPENAI_API_KEY ? "AZURE_OPENAI_API_KEY" : "AZURE_API_KEY";
        const token = env[tokenVar];
        let base = (0, cleaners_js_1.trimTrailingSlash)(env.AZURE_OPENAI_ENDPOINT ||
            env.AZURE_OPENAI_API_BASE ||
            env.AZURE_API_BASE ||
            env.AZURE_OPENAI_API_ENDPOINT);
        if (!token && !base) {
            return undefined;
        }
        if (token === constants_js_1.PLACEHOLDER_API_KEY) {
            throw new Error("AZURE_OPENAI_API_KEY not configured");
        }
        if (!base) {
            throw new Error("AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_BASE or AZURE_API_BASE missing");
        }
        if (base === constants_js_1.PLACEHOLDER_API_BASE) {
            throw new Error("AZURE_OPENAI_API_ENDPOINT not configured");
        }
        const version = parseModelApiVersion(provider, model) ||
            env[`AZURE_OPENAI_API_VERSION_${model.toLocaleUpperCase()}`] ||
            env.AZURE_OPENAI_API_VERSION ||
            env.AZURE_API_VERSION ||
            parseAzureVersionFromUrl(base);
        base = cleanAzureBase(base);
        if (!node_url_1.URL.canParse(base)) {
            throw new Error("AZURE_OPENAI_API_ENDPOINT must be a valid URL");
        }
        const azureCredentialsType = env.AZURE_OPENAI_API_CREDENTIALS?.toLowerCase().trim();
        return {
            provider,
            model,
            modelId,
            base,
            token,
            type: "azure",
            source: token ? "env: AZURE_OPENAI_API_..." : "env: AZURE_OPENAI_API_... + Entra ID",
            version,
            azureCredentialsType,
        };
    }
    if (provider === constants_js_1.MODEL_PROVIDER_AZURE_SERVERLESS_OPENAI) {
        dbg(`processing ${constants_js_1.MODEL_PROVIDER_AZURE_SERVERLESS_OPENAI}`);
        const tokenVar = "AZURE_SERVERLESS_OPENAI_API_KEY";
        dbg(`retrieved AZURE_SERVERLESS_OPENAI_API_KEY: ${env.AZURE_SERVERLESS_OPENAI_API_KEY}`);
        const token = env[tokenVar];
        let base = (0, cleaners_js_1.trimTrailingSlash)(env.AZURE_SERVERLESS_OPENAI_ENDPOINT || env.AZURE_SERVERLESS_OPENAI_API_ENDPOINT);
        if (!token && !base) {
            return undefined;
        }
        if (token === constants_js_1.PLACEHOLDER_API_KEY) {
            throw new Error("AZURE_SERVERLESS_OPENAI_API_KEY not configured");
        }
        if (!base) {
            throw new Error("AZURE_SERVERLESS_OPENAI_API_ENDPOINT missing");
        }
        if (base === constants_js_1.PLACEHOLDER_API_BASE) {
            throw new Error("AZURE_SERVERLESS_OPENAI_API_ENDPOINT not configured");
        }
        base = cleanAzureBase(base);
        if (!node_url_1.URL.canParse(base)) {
            throw new Error("AZURE_SERVERLESS_OPENAI_API_ENDPOINT must be a valid URL");
        }
        const version = env.AZURE_SERVERLESS_OPENAI_API_VERSION || env.AZURE_SERVERLESS_OPENAI_VERSION;
        const azureCredentialsType = env.AZURE_SERVERLESS_OPENAI_API_CREDENTIALS?.toLowerCase().trim();
        return {
            provider,
            model,
            modelId,
            base,
            token,
            type: "azure_serverless",
            source: token
                ? "env: AZURE_SERVERLESS_OPENAI_API_..."
                : "env: AZURE_SERVERLESS_OPENAI_API_... + Entra ID",
            version,
            azureCredentialsType,
        };
    }
    if (provider === constants_js_1.MODEL_PROVIDER_AZURE_AI_INFERENCE) {
        dbg(`processing ${constants_js_1.MODEL_PROVIDER_AZURE_AI_INFERENCE}`);
        // https://github.com/Azure/azure-sdk-for-js/tree/@azure-rest/ai-inference_1.0.0-beta.2/sdk/ai/ai-inference-rest
        dbg(`retrieved AZURE_AI_INFERENCE_API_KEY: ${env.AZURE_AI_INFERENCE_API_KEY}`);
        const tokenVar = "AZURE_AI_INFERENCE_API_KEY";
        const token = env[tokenVar]?.trim();
        let base = (0, cleaners_js_1.trimTrailingSlash)(env.AZURE_AI_INFERENCE_ENDPOINT || env.AZURE_AI_INFERENCE_API_ENDPOINT);
        if (!token && !base) {
            return undefined;
        }
        if (token === constants_js_1.PLACEHOLDER_API_KEY) {
            throw new Error("AZURE_AI_INFERENCE_API_KEY not configured");
        }
        if (!base) {
            throw new Error("AZURE_AI_INFERENCE_API_ENDPOINT missing");
        }
        if (base === constants_js_1.PLACEHOLDER_API_BASE) {
            throw new Error("AZURE_AI_INFERENCE_API_ENDPOINT not configured");
        }
        base = (0, cleaners_js_1.trimTrailingSlash)(base);
        if (!node_url_1.URL.canParse(base)) {
            throw new Error("AZURE_AI_INFERENCE_API_ENDPOINT must be a valid URL");
        }
        const version = env.AZURE_AI_INFERENCE_API_VERSION || env.AZURE_AI_INFERENCE_VERSION;
        return {
            provider,
            model,
            modelId,
            base,
            token,
            type: "azure_ai_inference",
            source: token
                ? "env: AZURE_AI_INFERENCE_API_..."
                : "env: AZURE_AI_INFERENCE_API_... + Entra ID",
            version,
        };
    }
    if (provider === constants_js_1.MODEL_PROVIDER_AZURE_SERVERLESS_MODELS) {
        dbg(`processing ${constants_js_1.MODEL_PROVIDER_AZURE_SERVERLESS_MODELS}`);
        // https://github.com/Azure/azure-sdk-for-js/tree/@azure-rest/ai-inference_1.0.0-beta.2/sdk/ai/ai-inference-rest
        const tokenVar = "AZURE_SERVERLESS_MODELS_API_KEY";
        const token = env[tokenVar]?.trim();
        let base = (0, cleaners_js_1.trimTrailingSlash)(env.AZURE_SERVERLESS_MODELS_ENDPOINT || env.AZURE_SERVERLESS_MODELS_API_ENDPOINT);
        if (!token && !base) {
            return undefined;
        }
        if (token === constants_js_1.PLACEHOLDER_API_KEY) {
            throw new Error("AZURE_SERVERLESS_MODELS_API_KEY not configured");
        }
        if (!base) {
            throw new Error("AZURE_SERVERLESS_MODELS_API_ENDPOINT missing");
        }
        if (base === constants_js_1.PLACEHOLDER_API_BASE) {
            throw new Error("AZURE_SERVERLESS_MODELS_API_ENDPOINT not configured");
        }
        base = (0, cleaners_js_1.trimTrailingSlash)(base);
        if (!node_url_1.URL.canParse(base)) {
            throw new Error("AZURE_SERVERLESS_MODELS_API_ENDPOINT must be a valid URL");
        }
        const version = env.AZURE_SERVERLESS_MODELS_API_VERSION || env.AZURE_SERVERLESS_MODELS_VERSION;
        return {
            provider,
            model,
            modelId,
            base,
            token,
            type: "azure_serverless_models",
            source: token
                ? "env: AZURE_SERVERLESS_MODELS_API_..."
                : "env: AZURE_SERVERLESS_MODELS_API_... + Entra ID",
            version,
        };
    }
    if (provider === constants_js_1.MODEL_PROVIDER_GOOGLE) {
        dbg(`processing ${constants_js_1.MODEL_PROVIDER_GOOGLE}`);
        const token = env.GEMINI_API_KEY || env.GOOGLE_API_KEY;
        if (!token) {
            return undefined;
        }
        if (token === constants_js_1.PLACEHOLDER_API_KEY) {
            throw new Error("GEMINI_API_KEY/GOOGLE_API_BASE not configured");
        }
        const base = env.GEMINI_API_BASE || env.GOOGLE_API_BASE || constants_js_1.GOOGLE_API_BASE;
        if (base === constants_js_1.PLACEHOLDER_API_BASE) {
            throw new Error("GEMINI_API_KEY/GOOGLE_API_BASE not configured");
        }
        return {
            provider,
            model,
            modelId,
            base,
            token,
            type: "openai",
            source: "env: GEMINI_API_...",
        };
    }
    if (provider === constants_js_1.MODEL_PROVIDER_ANTHROPIC) {
        dbg(`processing ${constants_js_1.MODEL_PROVIDER_ANTHROPIC}`);
        const modelKey = "ANTHROPIC_API_KEY";
        dbg(`retrieved ANTHROPIC_API_KEY: ${env.ANTHROPIC_API_KEY}`);
        const token = env[modelKey]?.trim();
        if (token === undefined || token === constants_js_1.PLACEHOLDER_API_KEY) {
            throw new Error("ANTHROPIC_API_KEY not configured");
        }
        const base = (0, cleaners_js_1.trimTrailingSlash)(env.ANTHROPIC_API_BASE) || constants_js_1.ANTHROPIC_API_BASE;
        const version = env.ANTHROPIC_API_VERSION || undefined;
        const source = "env: ANTHROPIC_API_...";
        return {
            provider,
            model,
            modelId,
            token,
            base,
            version,
            source,
        };
    }
    if (provider === constants_js_1.MODEL_PROVIDER_ANTHROPIC_BEDROCK) {
        dbg(`processing ${constants_js_1.MODEL_PROVIDER_ANTHROPIC_BEDROCK}`);
        return {
            provider,
            model,
            modelId,
            source: "AWS SDK",
            base: undefined,
            token: constants_js_1.MODEL_PROVIDER_ANTHROPIC_BEDROCK,
        };
    }
    if (provider === constants_js_1.MODEL_PROVIDER_MISTRAL) {
        dbg(`processing ${constants_js_1.MODEL_PROVIDER_MISTRAL}`);
        const base = env.MISTRAL_API_BASE || constants_js_1.MISTRAL_API_BASE;
        const token = env.MISTRAL_API_KEY;
        if (!token) {
            throw new Error("MISTRAL_API_KEY not configured");
        }
        return {
            provider,
            model,
            modelId,
            token,
            base,
            source: "env: MISTRAL_API_...",
            type: "openai",
        };
    }
    if (provider === constants_js_1.MODEL_PROVIDER_ALIBABA) {
        dbg(`processing ${constants_js_1.MODEL_PROVIDER_ALIBABA}`);
        const base = env.ALIBABA_API_BASE || env.DASHSCOPE_API_BASE || env.DASHSCOPE_HTTP_BASE_URL || constants_js_1.ALIBABA_BASE;
        if (base === constants_js_1.PLACEHOLDER_API_BASE) {
            throw new Error("ALIBABA_API_BASE not configured");
        }
        if (!node_url_1.URL.canParse(base)) {
            throw new Error(`${base} must be a valid URL`);
        }
        const token = env.ALIBABA_API_KEY || env.DASHSCOPE_API_KEY;
        if (token === undefined || token === constants_js_1.PLACEHOLDER_API_KEY) {
            throw new Error("ALIBABA_API_KEY not configured");
        }
        return {
            provider,
            model,
            modelId,
            base,
            token,
            type: "alibaba",
            source: "env: ALIBABA_API_...",
        };
    }
    if (provider === constants_js_1.MODEL_PROVIDER_OLLAMA) {
        dbg(`processing ${constants_js_1.MODEL_PROVIDER_OLLAMA}`);
        const host = ollamaParseHostVariable(env);
        const base = cleanApiBase(host);
        return {
            provider,
            model,
            modelId,
            base,
            token: constants_js_1.MODEL_PROVIDER_OLLAMA,
            type: "openai",
            source: "env: OLLAMA_HOST",
        };
    }
    if (provider === constants_js_1.MODEL_PROVIDER_DOCKER_MODEL_RUNNER) {
        dbg(`processing ${constants_js_1.MODEL_PROVIDER_DOCKER_MODEL_RUNNER}`);
        const base = env.DOCKER_MODEL_RUNNER_API_BASE || constants_js_1.DOCKER_MODEL_RUNNER_API_BASE;
        if (base === constants_js_1.PLACEHOLDER_API_BASE) {
            throw new Error("DOCKER_MODEL_RUNNER_API_BASE not configured");
        }
        if (!node_url_1.URL.canParse(base)) {
            throw new Error(`${base} must be a valid URL`);
        }
        return {
            provider,
            model,
            modelId,
            base,
            token: constants_js_1.MODEL_PROVIDER_DOCKER_MODEL_RUNNER,
            type: "openai",
            source: "env: DOCKER_MODEL_RUNNER",
        };
    }
    if (provider === constants_js_1.MODEL_PROVIDER_HUGGINGFACE) {
        dbg(`processing ${constants_js_1.MODEL_PROVIDER_HUGGINGFACE}`);
        const prefixes = ["HUGGINGFACE", "HF"];
        const token = findEnvVar(env, prefixes, TOKEN_SUFFIX);
        const base = findEnvVar(env, prefixes, BASE_SUFFIX)?.value || constants_js_1.HUGGINGFACE_API_BASE;
        if (!node_url_1.URL.canParse(base)) {
            throw new Error(`${base} must be a valid URL`);
        }
        if (!token?.value) {
            throw new Error("HuggingFace token missing");
        }
        return {
            base,
            modelId,
            token: token?.value,
            provider,
            model,
            type: "huggingface",
            source: "env: HUGGINGFACE_API_...",
        };
    }
    if (provider === constants_js_1.MODEL_PROVIDER_DEEPSEEK) {
        dbg(`processing ${constants_js_1.MODEL_PROVIDER_DEEPSEEK}`);
        const base = findEnvVar(env, "DEEPSEEK", BASE_SUFFIX)?.value || constants_js_1.DEEPSEEK_API_BASE;
        if (!node_url_1.URL.canParse(base)) {
            throw new Error(`${base} must be a valid URL`);
        }
        const token = env.DEEPSEEK_API_KEY;
        if (!token) {
            throw new Error("DEEPSEEK_API_KEY not configured");
        }
        return {
            provider,
            model,
            modelId,
            base,
            token,
            type: "openai",
            source: "env: DEEPSEEK_API_...",
        };
    }
    if (provider === constants_js_1.MODEL_PROVIDER_WHISPERASR) {
        dbg(`processing ${constants_js_1.MODEL_PROVIDER_WHISPERASR}`);
        const base = findEnvVar(env, "WHISPERASR", BASE_SUFFIX)?.value || constants_js_1.WHISPERASR_API_BASE;
        if (!node_url_1.URL.canParse(base)) {
            throw new Error(`${base} must be a valid URL`);
        }
        return {
            provider,
            model,
            modelId,
            base,
            token: undefined,
            source: "env: WHISPERASR_API_...",
        };
    }
    if (provider === constants_js_1.MODEL_PROVIDER_WINDOWS_AI) {
        dbg(`processing ${constants_js_1.MODEL_PROVIDER_WINDOWS_AI}`);
        return {
            provider,
            model,
            modelId,
            base: constants_js_1.WINDOWS_AI_API_BASE,
            token: constants_js_1.MODEL_PROVIDER_WINDOWS_AI,
            type: "openai",
            source: "env",
        };
    }
    if (provider === constants_js_1.MODEL_PROVIDER_SGLANG) {
        dbg(`processing MODEL_PROVIDER_SGLANG`);
        const base = findEnvVar(env, "SGLANG", BASE_SUFFIX)?.value || constants_js_1.SGLANG_API_BASE;
        if (!node_url_1.URL.canParse(base)) {
            throw new Error(`${base} must be a valid URL`);
        }
        return {
            provider,
            model,
            modelId,
            base,
            token: constants_js_1.MODEL_PROVIDER_SGLANG,
            type: "openai",
            source: "default",
        };
    }
    if (provider === constants_js_1.MODEL_PROVIDER_VLLM) {
        dbg(`processing MODEL_PROVIDER_VLLM`);
        const base = findEnvVar(env, "VLLM", BASE_SUFFIX)?.value || constants_js_1.VLLM_API_BASE;
        if (!node_url_1.URL.canParse(base)) {
            throw new Error(`${base} must be a valid URL`);
        }
        return {
            provider,
            model,
            modelId,
            base,
            token: constants_js_1.MODEL_PROVIDER_VLLM,
            type: "openai",
            source: "default",
        };
    }
    if (provider === constants_js_1.MODEL_PROVIDER_LLAMAFILE) {
        dbg(`processing MODEL_PROVIDER_LLAMAFILE`);
        const base = findEnvVar(env, "LLAMAFILE", BASE_SUFFIX)?.value || constants_js_1.LLAMAFILE_API_BASE;
        if (!node_url_1.URL.canParse(base)) {
            throw new Error(`${base} must be a valid URL`);
        }
        return {
            provider,
            model,
            modelId,
            base,
            token: constants_js_1.MODEL_PROVIDER_LLAMAFILE,
            type: "openai",
            source: "default",
        };
    }
    if (provider === constants_js_1.MODEL_PROVIDER_LITELLM) {
        dbg(`processing MODEL_PROVIDER_LITELLM`);
        const base = findEnvVar(env, "LITELLM", BASE_SUFFIX)?.value || constants_js_1.LITELLM_API_BASE;
        if (!node_url_1.URL.canParse(base)) {
            throw new Error(`${base} must be a valid URL`);
        }
        return {
            provider,
            model,
            modelId,
            base,
            token: constants_js_1.MODEL_PROVIDER_LITELLM,
            type: "openai",
            source: "default",
        };
    }
    if (provider === constants_js_1.MODEL_PROVIDER_LMSTUDIO) {
        dbg(`processing MODEL_PROVIDER_LMSTUDIO`);
        const base = findEnvVar(env, "LMSTUDIO", BASE_SUFFIX)?.value || constants_js_1.LMSTUDIO_API_BASE;
        if (!node_url_1.URL.canParse(base)) {
            throw new Error(`${base} must be a valid URL`);
        }
        return {
            provider,
            model,
            modelId,
            base,
            token: constants_js_1.MODEL_PROVIDER_LMSTUDIO,
            type: "openai",
            source: "env: LMSTUDIO_API_...",
        };
    }
    if (provider === constants_js_1.MODEL_PROVIDER_JAN) {
        dbg(`processing MODEL_PROVIDER_JAN`);
        const base = findEnvVar(env, "JAN", BASE_SUFFIX)?.value || constants_js_1.JAN_API_BASE;
        if (!node_url_1.URL.canParse(base)) {
            throw new Error(`${base} must be a valid URL`);
        }
        return {
            provider,
            model,
            modelId,
            base,
            token: constants_js_1.MODEL_PROVIDER_JAN,
            type: "openai",
            source: "env: JAN_API_...",
        };
    }
    if (provider === constants_js_1.MODEL_PROVIDER_GITHUB_COPILOT_CHAT) {
        dbg(`processing MODEL_PROVIDER_GITHUB_COPILOT_CHAT`);
        if (!runtimeHost.clientLanguageModel) {
            throw new Error(`${constants_js_1.MODEL_PROVIDER_GITHUB_COPILOT_CHAT} requires Visual Studio Code and GitHub Copilot Chat`);
        }
        return {
            provider,
            model,
            modelId,
            base: undefined,
            token: constants_js_1.MODEL_PROVIDER_GITHUB_COPILOT_CHAT,
        };
    }
    if (provider === constants_js_1.MODEL_PROVIDER_MCP) {
        dbg(`processing MODEL_PROVIDER_MCP`);
        if (!runtimeHost.clientLanguageModel) {
            throw new Error(`${constants_js_1.MODEL_PROVIDER_MCP} requires MCP Client with Sampling.`);
        }
        return {
            provider,
            model,
            modelId,
            base: undefined,
            token: constants_js_1.MODEL_PROVIDER_MCP,
        };
    }
    if (provider === constants_js_1.MODEL_PROVIDER_ECHO || provider === constants_js_1.MODEL_PROVIDER_NONE) {
        dbg(`processing MODEL_PROVIDER_ECHO or MODEL_PROVIDER_NONE`);
        return {
            provider,
            model,
            modelId,
            base: undefined,
            token: provider,
        };
    }
    // generic
    const prefixes = [
        tag ? `${provider}_${model}_${tag}` : undefined,
        provider ? `${provider}_${model}` : undefined,
        provider ? provider : undefined,
        model,
    ]
        .filter((p) => p)
        .map((p) => p.toUpperCase().replace(/[^a-z0-9]+/gi, "_"));
    for (const prefix of prefixes) {
        const modelKey = findEnvVar(env, prefix, TOKEN_SUFFIX);
        const modelBase = findEnvVar(env, prefix, BASE_SUFFIX);
        if (modelKey || modelBase) {
            const token = modelKey?.value || "";
            const base = (0, cleaners_js_1.trimTrailingSlash)(modelBase?.value);
            const version = env[prefix + "_API_VERSION"];
            const type = env[prefix + "API_TYPE"] || "openai";
            const azureCredentialsType = env[prefix + `_API_CREDENTIALS`]
                ?.toLowerCase()
                .trim();
            if (base && !node_url_1.URL.canParse(base)) {
                throw new Error(`${modelBase} must be a valid URL`);
            }
            const source = `env: ${prefix}_API_...`;
            return (0, cleaners_js_1.deleteUndefinedValues)({
                provider,
                model,
                modelId,
                token,
                base,
                type,
                azureCredentialsType,
                version,
                source,
            });
        }
    }
    dbg(`no matching provider found, returning undefined`);
    return undefined;
    function cleanAzureBase(b) {
        if (!b) {
            return b;
        }
        const res = (0, cleaners_js_1.trimTrailingSlash)(b.replace(/\/openai\/deployments.*$/, "")) + `/openai/deployments`;
        return res;
    }
    function parseAzureVersionFromUrl(url) {
        const uri = (0, url_js_1.uriTryParse)(url);
        const v = uri?.searchParams.get("api-version") || undefined;
        // azure:gpt-4o_2024-11-20
        // {api-version}
        if (v?.startsWith("{"))
            return undefined;
        return v;
    }
    function cleanApiBase(b) {
        if (!b) {
            return b;
        }
        let res = (0, cleaners_js_1.trimTrailingSlash)(b);
        if (!/\/v1$/.test(res)) {
            res += "/v1";
        }
        return res;
    }
}
//# sourceMappingURL=env.js.map