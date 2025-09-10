import { normalizeFloat, trimTrailingSlash } from "./cleaners"
import {
    ANTHROPIC_API_BASE,
    AZURE_OPENAI_API_VERSION,
    GITHUB_MODELS_BASE,
    LITELLM_API_BASE,
    LLAMAFILE_API_BASE,
    LOCALAI_API_BASE,
    MODEL_PROVIDER_ANTHROPIC,
    MODEL_PROVIDER_AZURE_OPENAI,
    MODEL_PROVIDER_AZURE_SERVERLESS_MODELS,
    MODEL_PROVIDER_GITHUB_COPILOT_CHAT,
    MODEL_PROVIDER_GITHUB,
    MODEL_PROVIDER_LITELLM,
    MODEL_PROVIDER_LLAMAFILE,
    MODEL_PROVIDER_OLLAMA,
    MODEL_PROVIDER_OPENAI,
    OPENAI_API_BASE,
    PLACEHOLDER_API_BASE,
    PLACEHOLDER_API_KEY,
    MODEL_PROVIDER_AZURE_SERVERLESS_OPENAI,
    MODEL_PROVIDER_HUGGINGFACE,
    HUGGINGFACE_API_BASE,
    OLLAMA_API_BASE,
    OLLAMA_DEFAULT_PORT,
    MODEL_PROVIDER_GOOGLE,
    GOOGLE_API_BASE,
    MODEL_PROVIDER_ALIBABA,
    ALIBABA_BASE,
    MODEL_PROVIDER_MISTRAL,
    MISTRAL_API_BASE,
    MODEL_PROVIDER_LMSTUDIO,
    LMSTUDIO_API_BASE,
    MODEL_PROVIDER_JAN,
    JAN_API_BASE,
    MODEL_PROVIDER_ANTHROPIC_BEDROCK,
    MODEL_PROVIDER_DEEPSEEK,
    DEEPSEEK_API_BASE,
    MODEL_PROVIDER_WHISPERASR,
    WHISPERASR_API_BASE,
    MODEL_PROVIDER_ECHO,
    MODEL_PROVIDER_NONE,
    MODEL_PROVIDER_AZURE_AI_INFERENCE,
    MODEL_PROVIDER_WINDOWS_AI,
    WINDOWS_AI_API_BASE,
    MODEL_PROVIDER_SGLANG,
    SGLANG_API_BASE,
    MODEL_PROVIDER_VLLM,
    VLLM_API_BASE,
    GITHUB_TOKENS,
    MODEL_PROVIDER_DOCKER_MODEL_RUNNER,
    DOCKER_MODEL_RUNNER_API_BASE,
} from "./constants"
import { runtimeHost } from "./host"
import { parseModelIdentifier } from "./models"
import {
    AzureCredentialsType,
    LanguageModelConfiguration,
    OpenAIAPIType,
} from "./server/messages"
import { arrayify, ellipse } from "./util"
import { URL } from "node:url"
import { uriTryParse } from "./url"
import { TraceOptions } from "./trace"
import { CancellationOptions } from "./cancellation"
import { genaiscriptDebug } from "./debug"
const dbg = genaiscriptDebug("config:env")

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
export function ollamaParseHostVariable(env: Record<string, string>) {
    dbg(`ollamaParseHostVariable called with env: ${JSON.stringify(env)}`)
    const s = (
        env.OLLAMA_HOST ||
        env.OLLAMA_API_BASE ||
        OLLAMA_API_BASE
    )?.trim()
    const ipm =
        /^(?<address>(localhost|\d+\.\d+\.\d+\.\d+))(:(?<port>\d+))?$/i.exec(s)
    if (ipm) {
        return `http://${ipm.groups.address}:${ipm.groups.port || OLLAMA_DEFAULT_PORT}`
    }
    const url = new URL(s)
    return url.href
}

/**
 * Finds an environment variable based on provided prefixes and names.
 *
 * @param env - The environment variables as key-value pairs.
 * @param prefixes - A string or array of strings representing the possible prefixes for the variable name.
 * @param names - An array of variable names to match against the prefixes.
 * @returns An object containing the matched variable name and its value, or undefined if no match is found.
 */
export function findEnvVar(
    env: Record<string, string>,
    prefixes: string | string[],
    names: string[]
): { name: string; value: string } {
    for (const prefix of arrayify(prefixes)) {
        for (const name of names) {
            const pname = prefix + name
            const value =
                env[pname] ||
                env[pname.toLowerCase()] ||
                env[pname.toUpperCase()]
            if (value !== undefined) {
                return { name: pname, value }
            }
        }
    }
    return undefined
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
export async function parseDefaultsFromEnv(env: Record<string, string>) {
    dbg(`parsing process.env`)
    // legacy
    if (env.GENAISCRIPT_DEFAULT_MODEL) {
        dbg(`found GENAISCRIPT_DEFAULT_MODEL: ${env.GENAISCRIPT_DEFAULT_MODEL}`)
        runtimeHost.setModelAlias("env", "large", env.GENAISCRIPT_DEFAULT_MODEL)
    }

    const rx =
        /^GENAISCRIPT(_DEFAULT)?_((?<id>[A-Z0-9_\-]+)_MODEL|MODEL_(?<id2>[A-Z0-9_\-]+))$/i
    for (const kv of Object.entries(env)) {
        const [k, v] = kv
        const m = rx.exec(k)
        if (!m) {
            continue
        }
        const id = m.groups.id || m.groups.id2
        dbg(`found ${k} = ${v}`)
        runtimeHost.setModelAlias("env", id, v)
    }
    const t = normalizeFloat(env.GENAISCRIPT_DEFAULT_TEMPERATURE)
    if (!isNaN(t)) {
        dbg(`parsed GENAISCRIPT_DEFAULT_TEMPERATURE: ${t}`)
        runtimeHost.setModelAlias("env", "large", { temperature: t })
    }
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
export async function parseTokenFromEnv(
    env: Record<string, string>,
    modelId: string,
    options: TraceOptions & CancellationOptions & { resolveToken?: boolean }
): Promise<LanguageModelConfiguration> {
    const { resolveToken } = options || {}
    const { provider, model, tag } = parseModelIdentifier(
        modelId ?? runtimeHost.modelAliases.large.model
    )
    dbg(`parsing token for ${provider} ${model || ""} ${tag || ""}`)
    const TOKEN_SUFFIX = ["_API_KEY", "_API_TOKEN", "_TOKEN", "_KEY"]
    const BASE_SUFFIX = ["_API_BASE", "_API_ENDPOINT", "_BASE", "_ENDPOINT"]

    if (provider === MODEL_PROVIDER_OPENAI) {
        dbg(`processing ${MODEL_PROVIDER_OPENAI}`)
        const token = env.OPENAI_API_KEY ?? ""
        let base = env.OPENAI_API_BASE
        let type = (env.OPENAI_API_TYPE as OpenAIAPIType) || "openai"
        const version = env.OPENAI_API_VERSION || parseAzureVersionFromUrl(base)
        if (
            type !== "azure" &&
            type !== "openai" &&
            type !== "localai" &&
            type !== "azure_serverless" &&
            type !== "azure_serverless_models"
        ) {
            throw new Error(
                "OPENAI_API_TYPE must be 'azure', 'azure_serverless', 'azure_serverless_models' or 'openai' or 'localai'"
            )
        }
        if (type === "openai" && !base) {
            dbg(`setting default base for OPENAI_API_TYPE openai`)
            base = OPENAI_API_BASE
        }
        if (type === "localai" && !base) {
            base = LOCALAI_API_BASE
        }
        if ((type === "azure" || type === "azure_serverless") && !base) {
            throw new Error("OPENAI_API_BASE must be set when type is 'azure'")
        }
        if (type === "azure") {
            base = cleanAzureBase(base)
        }
        if (!token && !/^http:\/\//i.test(base)) {
            // localhost typically requires no key
            throw new Error("OPENAI_API_KEY missing")
        }
        if (token === PLACEHOLDER_API_KEY) {
            throw new Error("OPENAI_API_KEY not configured")
        }
        if (base === PLACEHOLDER_API_BASE) {
            throw new Error("OPENAI_API_BASE not configured")
        }
        if (base && !URL.canParse(base)) {
            throw new Error("OPENAI_API_BASE must be a valid URL")
        }
        return {
            provider,
            model,
            base,
            type,
            token,
            source: "env: OPENAI_API_...",
            version,
        } satisfies LanguageModelConfiguration
    }

    if (provider === MODEL_PROVIDER_GITHUB) {
        dbg(`processing ${MODEL_PROVIDER_GITHUB}`)
        const res = findEnvVar(env, "", [
            "GITHUB_MODELS_TOKEN",
            ...GITHUB_TOKENS,
        ]) || { name: undefined, value: undefined }
        if (!res?.value) {
            if (resolveToken) {
                const { exitCode, stdout } = await runtimeHost.exec(
                    undefined,
                    "gh",
                    ["auth", "token"],
                    options
                )
                if (exitCode !== 0)
                    throw new Error("Failed to resolve GitHub token")
                res.name = "gh auth token"
                res.value = stdout.trim()
            }
            if (!res?.value)
                throw new Error(
                    "GITHUB_MODELS_TOKEN, GITHUB_MODELS_TOKEN, GITHUB_TOKEN or GH_TOKEN must be set"
                )
        }
        const type = "github"
        const base = GITHUB_MODELS_BASE
        return {
            provider,
            model,
            base,
            token: res.value,
            type,
            source: `env: ${res.name}`,
        } satisfies LanguageModelConfiguration
    }

    if (provider === MODEL_PROVIDER_AZURE_OPENAI) {
        dbg(`processing ${MODEL_PROVIDER_AZURE_OPENAI}`)
        const tokenVar = env.AZURE_OPENAI_API_KEY
            ? "AZURE_OPENAI_API_KEY"
            : "AZURE_API_KEY"
        const token = env[tokenVar]
        let base = trimTrailingSlash(
            env.AZURE_OPENAI_ENDPOINT ||
                env.AZURE_OPENAI_API_BASE ||
                env.AZURE_API_BASE ||
                env.AZURE_OPENAI_API_ENDPOINT
        )
        if (!token && !base) {
            return undefined
        }
        //if (!token)
        //    throw new Error("AZURE_OPENAI_API_KEY or AZURE_API_KEY missing")
        if (token === PLACEHOLDER_API_KEY) {
            throw new Error("AZURE_OPENAI_API_KEY not configured")
        }
        if (!base) {
            throw new Error(
                "AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_BASE or AZURE_API_BASE missing"
            )
        }
        if (base === PLACEHOLDER_API_BASE) {
            throw new Error("AZURE_OPENAI_API_ENDPOINT not configured")
        }
        const version =
            env[`AZURE_OPENAI_API_VERSION_${model.toLocaleUpperCase()}`] ||
            env.AZURE_OPENAI_API_VERSION ||
            env.AZURE_API_VERSION ||
            parseAzureVersionFromUrl(base)
        base = cleanAzureBase(base)
        if (!URL.canParse(base)) {
            throw new Error("AZURE_OPENAI_API_ENDPOINT must be a valid URL")
        }
        const azureCredentialsType =
            env.AZURE_OPENAI_API_CREDENTIALS?.toLowerCase().trim() as AzureCredentialsType
        return {
            provider,
            model,
            base,
            token,
            type: "azure",
            source: token
                ? "env: AZURE_OPENAI_API_..."
                : "env: AZURE_OPENAI_API_... + Entra ID",
            version,
            azureCredentialsType,
        } satisfies LanguageModelConfiguration
    }

    if (provider === MODEL_PROVIDER_AZURE_SERVERLESS_OPENAI) {
        dbg(`processing ${MODEL_PROVIDER_AZURE_SERVERLESS_OPENAI}`)
        const tokenVar = "AZURE_SERVERLESS_OPENAI_API_KEY"
        dbg(
            `retrieved AZURE_SERVERLESS_OPENAI_API_KEY: ${env.AZURE_SERVERLESS_OPENAI_API_KEY}`
        )
        const token = env[tokenVar]
        let base = trimTrailingSlash(
            env.AZURE_SERVERLESS_OPENAI_ENDPOINT ||
                env.AZURE_SERVERLESS_OPENAI_API_ENDPOINT
        )
        if (!token && !base) {
            return undefined
        }
        if (token === PLACEHOLDER_API_KEY) {
            throw new Error("AZURE_SERVERLESS_OPENAI_API_KEY not configured")
        }
        if (!base) {
            throw new Error("AZURE_SERVERLESS_OPENAI_API_ENDPOINT missing")
        }
        if (base === PLACEHOLDER_API_BASE) {
            throw new Error(
                "AZURE_SERVERLESS_OPENAI_API_ENDPOINT not configured"
            )
        }
        base = cleanAzureBase(base)
        if (!URL.canParse(base)) {
            throw new Error(
                "AZURE_SERVERLESS_OPENAI_API_ENDPOINT must be a valid URL"
            )
        }
        const version =
            env.AZURE_SERVERLESS_OPENAI_API_VERSION ||
            env.AZURE_SERVERLESS_OPENAI_VERSION
        const azureCredentialsType =
            env.AZURE_SERVERLESS_OPENAI_API_CREDENTIALS?.toLowerCase().trim() as AzureCredentialsType
        return {
            provider,
            model,
            base,
            token,
            type: "azure_serverless",
            source: token
                ? "env: AZURE_SERVERLESS_OPENAI_API_..."
                : "env: AZURE_SERVERLESS_OPENAI_API_... + Entra ID",
            version,
            azureCredentialsType,
        } satisfies LanguageModelConfiguration
    }

    if (provider === MODEL_PROVIDER_AZURE_AI_INFERENCE) {
        dbg(`processing ${MODEL_PROVIDER_AZURE_AI_INFERENCE}`)
        // https://github.com/Azure/azure-sdk-for-js/tree/@azure-rest/ai-inference_1.0.0-beta.2/sdk/ai/ai-inference-rest
        dbg(
            `retrieved AZURE_AI_INFERENCE_API_KEY: ${env.AZURE_AI_INFERENCE_API_KEY}`
        )
        const tokenVar = "AZURE_AI_INFERENCE_API_KEY"
        const token = env[tokenVar]?.trim()
        let base = trimTrailingSlash(
            env.AZURE_AI_INFERENCE_ENDPOINT ||
                env.AZURE_AI_INFERENCE_API_ENDPOINT
        )
        if (!token && !base) {
            return undefined
        }
        if (token === PLACEHOLDER_API_KEY) {
            throw new Error("AZURE_AI_INFERENCE_API_KEY not configured")
        }
        if (!base) {
            throw new Error("AZURE_AI_INFERENCE_API_ENDPOINT missing")
        }
        if (base === PLACEHOLDER_API_BASE) {
            throw new Error("AZURE_AI_INFERENCE_API_ENDPOINT not configured")
        }
        base = trimTrailingSlash(base)
        if (!URL.canParse(base)) {
            throw new Error(
                "AZURE_AI_INFERENCE_API_ENDPOINT must be a valid URL"
            )
        }
        const version =
            env.AZURE_AI_INFERENCE_API_VERSION || env.AZURE_AI_INFERENCE_VERSION
        return {
            provider,
            model,
            base,
            token,
            type: "azure_ai_inference",
            source: token
                ? "env: AZURE_AI_INFERENCE_API_..."
                : "env: AZURE_AI_INFERENCE_API_... + Entra ID",
            version,
        } satisfies LanguageModelConfiguration
    }

    if (provider === MODEL_PROVIDER_AZURE_SERVERLESS_MODELS) {
        dbg(`processing ${MODEL_PROVIDER_AZURE_SERVERLESS_MODELS}`)
        // https://github.com/Azure/azure-sdk-for-js/tree/@azure-rest/ai-inference_1.0.0-beta.2/sdk/ai/ai-inference-rest
        const tokenVar = "AZURE_SERVERLESS_MODELS_API_KEY"
        const token = env[tokenVar]?.trim()
        let base = trimTrailingSlash(
            env.AZURE_SERVERLESS_MODELS_ENDPOINT ||
                env.AZURE_SERVERLESS_MODELS_API_ENDPOINT
        )
        if (!token && !base) {
            return undefined
        }
        if (token === PLACEHOLDER_API_KEY) {
            throw new Error("AZURE_SERVERLESS_MODELS_API_KEY not configured")
        }
        if (!base) {
            throw new Error("AZURE_SERVERLESS_MODELS_API_ENDPOINT missing")
        }
        if (base === PLACEHOLDER_API_BASE) {
            throw new Error(
                "AZURE_SERVERLESS_MODELS_API_ENDPOINT not configured"
            )
        }
        base = trimTrailingSlash(base)
        if (!URL.canParse(base)) {
            throw new Error(
                "AZURE_SERVERLESS_MODELS_API_ENDPOINT must be a valid URL"
            )
        }
        const version =
            env.AZURE_SERVERLESS_MODELS_API_VERSION ||
            env.AZURE_SERVERLESS_MODELS_VERSION
        return {
            provider,
            model,
            base,
            token,
            type: "azure_serverless_models",
            source: token
                ? "env: AZURE_SERVERLESS_MODELS_API_..."
                : "env: AZURE_SERVERLESS_MODELS_API_... + Entra ID",
            version,
        } satisfies LanguageModelConfiguration
    }

    if (provider === MODEL_PROVIDER_GOOGLE) {
        dbg(`processing ${MODEL_PROVIDER_GOOGLE}`)
        const token = env.GEMINI_API_KEY || env.GOOGLE_API_KEY
        if (!token) {
            return undefined
        }
        if (token === PLACEHOLDER_API_KEY) {
            throw new Error("GEMINI_API_KEY/GOOGLE_API_BASE not configured")
        }
        const base =
            env.GEMINI_API_BASE || env.GOOGLE_API_BASE || GOOGLE_API_BASE
        if (base === PLACEHOLDER_API_BASE) {
            throw new Error("GEMINI_API_KEY/GOOGLE_API_BASE not configured")
        }
        return {
            provider,
            model,
            base,
            token,
            type: "openai",
            source: "env: GEMINI_API_...",
        } satisfies LanguageModelConfiguration
    }

    if (provider === MODEL_PROVIDER_ANTHROPIC) {
        dbg(`processing ${MODEL_PROVIDER_ANTHROPIC}`)
        const modelKey = "ANTHROPIC_API_KEY"
        dbg(`retrieved ANTHROPIC_API_KEY: ${env.ANTHROPIC_API_KEY}`)
        const token = env[modelKey]?.trim()
        if (token === undefined || token === PLACEHOLDER_API_KEY) {
            throw new Error("ANTHROPIC_API_KEY not configured")
        }
        const base =
            trimTrailingSlash(env.ANTHROPIC_API_BASE) || ANTHROPIC_API_BASE
        const version = env.ANTHROPIC_API_VERSION || undefined
        const source = "env: ANTHROPIC_API_..."

        return {
            provider,
            model,
            token,
            base,
            version,
            source,
        } satisfies LanguageModelConfiguration
    }

    if (provider === MODEL_PROVIDER_ANTHROPIC_BEDROCK) {
        dbg(`processing ${MODEL_PROVIDER_ANTHROPIC_BEDROCK}`)
        return {
            provider,
            model,
            source: "AWS SDK",
            base: undefined,
            token: MODEL_PROVIDER_ANTHROPIC_BEDROCK,
        } satisfies LanguageModelConfiguration
    }

    if (provider === MODEL_PROVIDER_MISTRAL) {
        dbg(`processing ${MODEL_PROVIDER_MISTRAL}`)
        const base = env.MISTRAL_API_BASE || MISTRAL_API_BASE
        const token = env.MISTRAL_API_KEY
        if (!token) {
            throw new Error("MISTRAL_API_KEY not configured")
        }
        return {
            provider,
            model,
            token,
            base,
            source: "env: MISTRAL_API_...",
            type: "openai",
        } satisfies LanguageModelConfiguration
    }

    if (provider === MODEL_PROVIDER_ALIBABA) {
        dbg(`processing ${MODEL_PROVIDER_ALIBABA}`)
        const base =
            env.ALIBABA_API_BASE ||
            env.DASHSCOPE_API_BASE ||
            env.DASHSCOPE_HTTP_BASE_URL ||
            ALIBABA_BASE
        if (base === PLACEHOLDER_API_BASE) {
            throw new Error("ALIBABA_API_BASE not configured")
        }
        if (!URL.canParse(base)) {
            throw new Error(`${base} must be a valid URL`)
        }
        const token = env.ALIBABA_API_KEY || env.DASHSCOPE_API_KEY
        if (token === undefined || token === PLACEHOLDER_API_KEY) {
            throw new Error("ALIBABA_API_KEY not configured")
        }
        return {
            provider,
            model,
            base,
            token,
            type: "alibaba",
            source: "env: ALIBABA_API_...",
        }
    }

    if (provider === MODEL_PROVIDER_OLLAMA) {
        dbg(`processing ${MODEL_PROVIDER_OLLAMA}`)
        const host = ollamaParseHostVariable(env)
        const base = cleanApiBase(host)
        return {
            provider,
            model,
            base,
            token: MODEL_PROVIDER_OLLAMA,
            type: "openai",
            source: "env: OLLAMA_HOST",
        } satisfies LanguageModelConfiguration
    }

    if (provider === MODEL_PROVIDER_DOCKER_MODEL_RUNNER) {
        dbg(`processing ${MODEL_PROVIDER_DOCKER_MODEL_RUNNER}`)
        const base =
            env.DOCKER_MODEL_RUNNER_API_BASE || DOCKER_MODEL_RUNNER_API_BASE
        if (base === PLACEHOLDER_API_BASE) {
            throw new Error("DOCKER_MODEL_RUNNER_API_BASE not configured")
        }
        if (!URL.canParse(base)) {
            throw new Error(`${base} must be a valid URL`)
        }
        return {
            provider,
            model,
            base,
            token: MODEL_PROVIDER_DOCKER_MODEL_RUNNER,
            type: "openai",
            source: "env: DOCKER_MODEL_RUNNER",
        } satisfies LanguageModelConfiguration
    }

    if (provider === MODEL_PROVIDER_HUGGINGFACE) {
        dbg(`processing ${MODEL_PROVIDER_HUGGINGFACE}`)
        const prefixes = ["HUGGINGFACE", "HF"]
        const token = findEnvVar(env, prefixes, TOKEN_SUFFIX)
        const base =
            findEnvVar(env, prefixes, BASE_SUFFIX)?.value ||
            HUGGINGFACE_API_BASE
        if (!URL.canParse(base)) {
            throw new Error(`${base} must be a valid URL`)
        }
        if (!token?.value) {
            throw new Error("HuggingFace token missing")
        }
        return {
            base,
            token: token?.value,
            provider,
            model,
            type: "huggingface",
            source: "env: HUGGINGFACE_API_...",
        } satisfies LanguageModelConfiguration
    }

    if (provider === MODEL_PROVIDER_DEEPSEEK) {
        dbg(`processing ${MODEL_PROVIDER_DEEPSEEK}`)
        const base =
            findEnvVar(env, "DEEPSEEK", BASE_SUFFIX)?.value || DEEPSEEK_API_BASE
        if (!URL.canParse(base)) {
            throw new Error(`${base} must be a valid URL`)
        }
        const token = env.DEEPSEEK_API_KEY
        if (!token) {
            throw new Error("DEEPSEEK_API_KEY not configured")
        }
        return {
            provider,
            model,
            base,
            token,
            type: "openai",
            source: "env: DEEPSEEK_API_...",
        }
    }

    if (provider === MODEL_PROVIDER_WHISPERASR) {
        dbg(`processing ${MODEL_PROVIDER_WHISPERASR}`)
        const base =
            findEnvVar(env, "WHISPERASR", BASE_SUFFIX)?.value ||
            WHISPERASR_API_BASE
        if (!URL.canParse(base)) {
            throw new Error(`${base} must be a valid URL`)
        }
        return {
            provider,
            model,
            base,
            token: undefined,
            source: "env: WHISPERASR_API_...",
        }
    }

    if (provider === MODEL_PROVIDER_WINDOWS_AI) {
        dbg(`processing ${MODEL_PROVIDER_WINDOWS_AI}`)
        return {
            provider,
            model,
            base: WINDOWS_AI_API_BASE,
            token: MODEL_PROVIDER_WINDOWS_AI,
            type: "openai",
            source: "env",
        }
    }

    const prefixes = [
        tag ? `${provider}_${model}_${tag}` : undefined,
        provider ? `${provider}_${model}` : undefined,
        provider ? provider : undefined,
        model,
    ]
        .filter((p) => p)
        .map((p) => p.toUpperCase().replace(/[^a-z0-9]+/gi, "_"))
    for (const prefix of prefixes) {
        const modelKey = findEnvVar(env, prefix, TOKEN_SUFFIX)
        const modelBase = findEnvVar(env, prefix, BASE_SUFFIX)
        if (modelKey || modelBase) {
            const token = modelKey?.value || ""
            const base = trimTrailingSlash(modelBase?.value)
            const version = env[prefix + "_API_VERSION"]
            const source = `env: ${prefix}_API_...`
            const type: OpenAIAPIType = "openai"
            if (base && !URL.canParse(base)) {
                throw new Error(`${modelBase} must be a valid URL`)
            }
            return {
                provider,
                model,
                token,
                base,
                type,
                version,
                source,
            } satisfies LanguageModelConfiguration
        }
    }

    if (provider === MODEL_PROVIDER_SGLANG) {
        dbg(`processing MODEL_PROVIDER_SGLANG`)
        const base =
            findEnvVar(env, "SGLANG", BASE_SUFFIX)?.value || SGLANG_API_BASE
        if (!URL.canParse(base)) {
            throw new Error(`${base} must be a valid URL`)
        }
        return {
            provider,
            model,
            base,
            token: MODEL_PROVIDER_SGLANG,
            type: "openai",
            source: "default",
        }
    }

    if (provider === MODEL_PROVIDER_VLLM) {
        dbg(`processing MODEL_PROVIDER_VLLM`)
        const base =
            findEnvVar(env, "VLLM", BASE_SUFFIX)?.value || VLLM_API_BASE
        if (!URL.canParse(base)) {
            throw new Error(`${base} must be a valid URL`)
        }
        return {
            provider,
            model,
            base,
            token: MODEL_PROVIDER_VLLM,
            type: "openai",
            source: "default",
        }
    }

    if (provider === MODEL_PROVIDER_LLAMAFILE) {
        dbg(`processing MODEL_PROVIDER_LLAMAFILE`)
        const base =
            findEnvVar(env, "LLAMAFILE", BASE_SUFFIX)?.value ||
            LLAMAFILE_API_BASE
        if (!URL.canParse(base)) {
            throw new Error(`${base} must be a valid URL`)
        }
        return {
            provider,
            model,
            base,
            token: MODEL_PROVIDER_LLAMAFILE,
            type: "openai",
            source: "default",
        }
    }

    if (provider === MODEL_PROVIDER_LITELLM) {
        dbg(`processing MODEL_PROVIDER_LITELLM`)
        const base =
            findEnvVar(env, "LITELLM", BASE_SUFFIX)?.value || LITELLM_API_BASE
        if (!URL.canParse(base)) {
            throw new Error(`${base} must be a valid URL`)
        }
        const token = env.LITELLM_API_KEY;
        return {
            provider,
            model,
            base,
            token,
            type: "openai",
            source: "default",
        }
    }

    if (provider === MODEL_PROVIDER_LMSTUDIO) {
        dbg(`processing MODEL_PROVIDER_LMSTUDIO`)
        const base =
            findEnvVar(env, "LMSTUDIO", BASE_SUFFIX)?.value || LMSTUDIO_API_BASE
        if (!URL.canParse(base)) {
            throw new Error(`${base} must be a valid URL`)
        }
        return {
            provider,
            model,
            base,
            token: MODEL_PROVIDER_LMSTUDIO,
            type: "openai",
            source: "env: LMSTUDIO_API_...",
        }
    }

    if (provider === MODEL_PROVIDER_JAN) {
        dbg(`processing MODEL_PROVIDER_JAN`)
        const base = findEnvVar(env, "JAN", BASE_SUFFIX)?.value || JAN_API_BASE
        if (!URL.canParse(base)) {
            throw new Error(`${base} must be a valid URL`)
        }
        return {
            provider,
            model,
            base,
            token: MODEL_PROVIDER_JAN,
            type: "openai",
            source: "env: JAN_API_...",
        }
    }

    if (provider === MODEL_PROVIDER_GITHUB_COPILOT_CHAT) {
        dbg(`processing MODEL_PROVIDER_GITHUB_COPILOT_CHAT`)
        if (!runtimeHost.clientLanguageModel) {
            throw new Error(
                `${MODEL_PROVIDER_GITHUB_COPILOT_CHAT} requires Visual Studio Code and GitHub Copilot Chat`
            )
        }
        return {
            provider,
            model,
            base: undefined,
            token: MODEL_PROVIDER_GITHUB_COPILOT_CHAT,
        }
    }

    if (provider === MODEL_PROVIDER_ECHO || provider === MODEL_PROVIDER_NONE) {
        dbg(`processing MODEL_PROVIDER_ECHO or MODEL_PROVIDER_NONE`)
        return {
            provider,
            model,
            base: undefined,
            token: provider,
        }
    }

    return undefined
    dbg(`no matching provider found, returning undefined`)

    function cleanAzureBase(b: string) {
        if (!b) {
            return b
        }
        b =
            trimTrailingSlash(b.replace(/\/openai\/deployments.*$/, "")) +
            `/openai/deployments`
        return b
    }

    function parseAzureVersionFromUrl(url: string) {
        const uri = uriTryParse(url)
        const v = uri?.searchParams.get("api-version") || undefined
        // azure:gpt-4o_2024-11-20
        // {api-version}
        if (v?.startsWith("{")) return undefined

        return v
    }

    function cleanApiBase(b: string) {
        if (!b) {
            return b
        }
        b = trimTrailingSlash(b)
        if (!/\/v1$/.test(b)) {
            b += "/v1"
        }
        return b
    }
}
