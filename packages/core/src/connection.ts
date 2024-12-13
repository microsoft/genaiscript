import {
    ANTHROPIC_API_BASE,
    AZURE_AI_INFERENCE_VERSION,
    AZURE_OPENAI_API_VERSION,
    GITHUB_MODELS_BASE,
    LITELLM_API_BASE,
    LLAMAFILE_API_BASE,
    LOCALAI_API_BASE,
    MODEL_PROVIDER_ANTHROPIC,
    MODEL_PROVIDER_AZURE_OPENAI,
    MODEL_PROVIDER_AZURE_SERVERLESS_MODELS,
    MODEL_PROVIDER_CLIENT,
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
    OLLAMA_DEFAUT_PORT,
    MODEL_PROVIDER_GOOGLE,
    GOOGLE_API_BASE,
    MODEL_PROVIDER_TRANSFORMERS,
    MODEL_PROVIDER_ALIBABA,
    ALIBABA_BASE,
    MODEL_PROVIDER_MISTRAL,
    MISTRAL_API_BASE,
    MODEL_PROVIDER_LMSTUDIO,
    LMSTUDIO_API_BASE,
    MODEL_PROVIDER_JAN,
    JAN_API_BASE,
} from "./constants"
import {
    OpenAIAPIType,
    host,
    LanguageModelConfiguration,
    AzureCredentialsType,
    runtimeHost,
} from "./host"
import { parseModelIdentifier } from "./models"
import { normalizeFloat, trimTrailingSlash } from "./util"

export function ollamaParseHostVariable(env: Record<string, string>) {
    const s = (
        env.OLLAMA_HOST ||
        env.OLLAMA_API_BASE ||
        OLLAMA_API_BASE
    )?.trim()
    const ipm =
        /^(?<address>(localhost|\d+\.\d+\.\d+\.\d+))(:(?<port>\d+))?$/i.exec(s)
    if (ipm)
        return `http://${ipm.groups.address}:${ipm.groups.port || OLLAMA_DEFAUT_PORT}`
    const url = new URL(s)
    return url.href
}

export function findEnvVar(
    env: Record<string, string>,
    prefix: string,
    names: string[]
): { name: string; value: string } {
    for (const name of names) {
        const pname = prefix + name
        const value =
            env[pname] || env[pname.toLowerCase()] || env[pname.toUpperCase()]
        if (value !== undefined) return { name: pname, value }
    }
    return undefined
}

export async function parseDefaultsFromEnv(env: Record<string, string>) {
    // legacy
    if (env.GENAISCRIPT_DEFAULT_MODEL)
        runtimeHost.modelAliases.large.model = env.GENAISCRIPT_DEFAULT_MODEL

    const rx =
        /^GENAISCRIPT(_DEFAULT)?_((?<id>[A-Z0-9_\-]+)_MODEL|MODEL_(?<id2>[A-Z0-9_\-]+))$/i
    for (const kv of Object.entries(env)) {
        const [k, v] = kv
        const m = rx.exec(k)
        if (!m) continue
        const id = m.groups.id || m.groups.id2
        runtimeHost.setModelAlias("env", id, v)
    }
    const t = normalizeFloat(env.GENAISCRIPT_DEFAULT_TEMPERATURE)
    if (!isNaN(t)) runtimeHost.modelAliases.large.temperature = t
}

export async function parseTokenFromEnv(
    env: Record<string, string>,
    modelId: string
): Promise<LanguageModelConfiguration> {
    const { provider, model, tag } = parseModelIdentifier(
        modelId ?? runtimeHost.modelAliases.large.model
    )
    const TOKEN_SUFFIX = ["_API_KEY", "_API_TOKEN", "_TOKEN", "_KEY"]
    const BASE_SUFFIX = ["_API_BASE", "_API_ENDPOINT", "_BASE", "_ENDPOINT"]

    if (provider === MODEL_PROVIDER_OPENAI) {
        const token = env.OPENAI_API_KEY ?? ""
        let base = env.OPENAI_API_BASE
        let type = (env.OPENAI_API_TYPE as OpenAIAPIType) || "openai"
        const version = env.OPENAI_API_VERSION
        if (
            type !== "azure" &&
            type !== "openai" &&
            type !== "localai" &&
            type !== "azure_serverless" &&
            type !== "azure_serverless_models"
        )
            throw new Error(
                "OPENAI_API_TYPE must be 'azure', 'azure_serverless', 'azure_serverless_models' or 'openai' or 'localai'"
            )
        if (type === "openai" && !base) base = OPENAI_API_BASE
        if (type === "localai" && !base) base = LOCALAI_API_BASE
        if ((type === "azure" || type === "azure_serverless") && !base)
            throw new Error("OPENAI_API_BASE must be set when type is 'azure'")
        if (type === "azure") base = cleanAzureBase(base)
        if (type === "azure" && version && version !== AZURE_OPENAI_API_VERSION)
            throw new Error(
                `OPENAI_API_VERSION must be '${AZURE_OPENAI_API_VERSION}'`
            )
        if (!token && !/^http:\/\//i.test(base))
            // localhost typically requires no key
            throw new Error("OPENAI_API_KEY missing")
        if (token === PLACEHOLDER_API_KEY)
            throw new Error("OPENAI_API_KEY not configured")
        if (base === PLACEHOLDER_API_BASE)
            throw new Error("OPENAI_API_BASE not configured")
        if (base && !URL.canParse(base))
            throw new Error("OPENAI_API_BASE must be a valid URL")
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
        const tokenVar = env.GITHUB_MODELS_TOKEN
            ? "GITHUB_MODELS_TOKEN"
            : "GITHUB_TOKEN"
        const token = env[tokenVar]
        if (!token)
            throw new Error("GITHUB_MODELS_TOKEN or GITHUB_TOKEN must be set")
        const type = "openai"
        const base = GITHUB_MODELS_BASE
        return {
            provider,
            model,
            base,
            type,
            token,
            source: `env: ${tokenVar}`,
        } satisfies LanguageModelConfiguration
    }

    if (provider === MODEL_PROVIDER_AZURE_OPENAI) {
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
        if (!token && !base) return undefined
        //if (!token)
        //    throw new Error("AZURE_OPENAI_API_KEY or AZURE_API_KEY missing")
        if (token === PLACEHOLDER_API_KEY)
            throw new Error("AZURE_OPENAI_API_KEY not configured")
        if (!base)
            throw new Error(
                "AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_BASE or AZURE_API_BASE missing"
            )
        if (base === PLACEHOLDER_API_BASE)
            throw new Error("AZURE_OPENAI_API_ENDPOINT not configured")
        base = cleanAzureBase(base)
        if (!URL.canParse(base))
            throw new Error("AZURE_OPENAI_API_ENDPOINT must be a valid URL")
        const version = env.AZURE_OPENAI_API_VERSION || env.AZURE_API_VERSION
        if (version && version !== AZURE_OPENAI_API_VERSION)
            throw new Error(
                `AZURE_OPENAI_API_VERSION must be '${AZURE_OPENAI_API_VERSION}'`
            )
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
        const tokenVar = "AZURE_SERVERLESS_OPENAI_API_KEY"
        const token = env[tokenVar]
        let base = trimTrailingSlash(
            env.AZURE_SERVERLESS_OPENAI_ENDPOINT ||
                env.AZURE_SERVERLESS_OPENAI_API_ENDPOINT
        )
        if (!token && !base) return undefined
        if (token === PLACEHOLDER_API_KEY)
            throw new Error("AZURE_SERVERLESS_OPENAI_API_KEY not configured")
        if (!base)
            throw new Error("AZURE_SERVERLESS_OPENAI_API_ENDPOINT missing")
        if (base === PLACEHOLDER_API_BASE)
            throw new Error(
                "AZURE_SERVERLESS_OPENAI_API_ENDPOINT not configured"
            )
        base = cleanAzureBase(base)
        if (!URL.canParse(base))
            throw new Error(
                "AZURE_SERVERLESS_OPENAI_API_ENDPOINT must be a valid URL"
            )
        const version =
            env.AZURE_SERVERLESS_OPENAI_API_VERSION ||
            env.AZURE_SERVERLESS_OPENAI_VERSION
        const azureCredentialsType =
            env.AZURE_SERVERLESS_OPENAI_API_CREDENTIALS?.toLowerCase().trim() as AzureCredentialsType

        if (version && version !== AZURE_OPENAI_API_VERSION)
            throw new Error(
                `AZURE_SERVERLESS_OPENAI_API_VERSION must be '${AZURE_OPENAI_API_VERSION}'`
            )
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

    if (provider === MODEL_PROVIDER_AZURE_SERVERLESS_MODELS) {
        // https://github.com/Azure/azure-sdk-for-js/tree/@azure-rest/ai-inference_1.0.0-beta.2/sdk/ai/ai-inference-rest
        const tokenVar = "AZURE_SERVERLESS_MODELS_API_KEY"
        const token = env[tokenVar]?.trim()
        let base = trimTrailingSlash(
            env.AZURE_SERVERLESS_MODELS_ENDPOINT ||
                env.AZURE_SERVERLESS_MODELS_API_ENDPOINT
        )
        if (!token && !base) return undefined
        if (token === PLACEHOLDER_API_KEY)
            throw new Error("AZURE_SERVERLESS_MODELS_API_KEY not configured")
        if (!base)
            throw new Error("AZURE_SERVERLESS_MODELS_API_ENDPOINT missing")
        if (base === PLACEHOLDER_API_BASE)
            throw new Error(
                "AZURE_SERVERLESS_MODELS_API_ENDPOINT not configured"
            )
        base = trimTrailingSlash(base)
        if (!URL.canParse(base))
            throw new Error(
                "AZURE_SERVERLESS_MODELS_API_ENDPOINT must be a valid URL"
            )
        const version =
            env.AZURE_SERVERLESS_MODELS_API_VERSION ||
            env.AZURE_SERVERLESS_MODELS_VERSION
        if (version && version !== AZURE_AI_INFERENCE_VERSION)
            throw new Error(
                `AZURE_SERVERLESS_MODELS_API_VERSION must be '${AZURE_AI_INFERENCE_VERSION}'`
            )
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
        const token = env.GOOGLE_API_KEY
        if (!token) return undefined
        if (token === PLACEHOLDER_API_KEY)
            throw new Error("GOOGLE_API_KEY not configured")
        const base = env.GOOGLE_API_BASE || GOOGLE_API_BASE
        if (base === PLACEHOLDER_API_BASE)
            throw new Error("GOOGLE_API_BASE not configured")
        return {
            provider,
            model,
            base,
            token,
            type: "openai",
            source: "env: GOOGLE_API_...",
        } satisfies LanguageModelConfiguration
    }

    if (provider === MODEL_PROVIDER_ANTHROPIC) {
        const modelKey = "ANTHROPIC_API_KEY"
        const token = env[modelKey]?.trim()
        if (token === undefined || token === PLACEHOLDER_API_KEY)
            throw new Error("ANTHROPIC_API_KEY not configured")
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

    if (provider === MODEL_PROVIDER_MISTRAL) {
        const base = env.MISTRAL_API_BASE || MISTRAL_API_BASE
        const token = env.MISTRAL_API_KEY
        if (!token) throw new Error("MISTRAL_API_KEY not configured")
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
        const base =
            env.ALIBABA_API_BASE ||
            env.DASHSCOPE_API_BASE ||
            env.DASHSCOPE_HTTP_BASE_URL ||
            ALIBABA_BASE
        if (base === PLACEHOLDER_API_BASE)
            throw new Error("ALIBABA_API_BASE not configured")
        if (!URL.canParse(base)) throw new Error(`${base} must be a valid URL`)
        const token = env.ALIBABA_API_KEY || env.DASHSCOPE_API_KEY
        if (token === undefined || token === PLACEHOLDER_API_KEY)
            throw new Error("ALIBABA_API_KEY not configured")
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
        const host = ollamaParseHostVariable(env)
        const base = cleanApiBase(host)
        return {
            provider,
            model,
            base,
            token: "ollama",
            type: "openai",
            source: "env: OLLAMA_HOST",
        } satisfies LanguageModelConfiguration
    }

    if (provider === MODEL_PROVIDER_HUGGINGFACE) {
        const prefix = "HUGGINGFACE"
        const token = findEnvVar(env, prefix, TOKEN_SUFFIX)
        const base =
            findEnvVar(env, prefix, BASE_SUFFIX)?.value || HUGGINGFACE_API_BASE
        if (!URL.canParse(base)) throw new Error(`${base} must be a valid URL`)
        if (!token?.value) throw new Error("HUGGINGFACE_API_KEY missing")
        return {
            base,
            token: token?.value,
            provider,
            model,
            type: "openai",
            source: "env: HUGGINGFACE_API_...",
        } satisfies LanguageModelConfiguration
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
            if (base && !URL.canParse(base))
                throw new Error(`${modelBase} must be a valid URL`)
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

    if (provider === MODEL_PROVIDER_LLAMAFILE) {
        const base =
            findEnvVar(env, "LLAMAFILE", BASE_SUFFIX)?.value ||
            LLAMAFILE_API_BASE
        if (!URL.canParse(base)) throw new Error(`${base} must be a valid URL`)
        return {
            provider,
            model,
            base,
            token: "llamafile",
            type: "openai",
            source: "default",
        }
    }

    if (provider === MODEL_PROVIDER_LITELLM) {
        const base =
            findEnvVar(env, "LITELLM", BASE_SUFFIX)?.value || LITELLM_API_BASE
        if (!URL.canParse(base)) throw new Error(`${base} must be a valid URL`)
        return {
            provider,
            model,
            base,
            token: "litellm",
            type: "openai",
            source: "default",
        }
    }

    if (provider === MODEL_PROVIDER_LMSTUDIO) {
        const base =
            findEnvVar(env, "LMSTUDIO", BASE_SUFFIX)?.value || LMSTUDIO_API_BASE
        if (!URL.canParse(base)) throw new Error(`${base} must be a valid URL`)
        return {
            provider,
            model,
            base,
            token: "lmstudio",
            type: "openai",
            source: "env: LMSTUDIO_API_...",
        }
    }

    if (provider === MODEL_PROVIDER_JAN) {
        const base = findEnvVar(env, "JAN", BASE_SUFFIX)?.value || JAN_API_BASE
        if (!URL.canParse(base)) throw new Error(`${base} must be a valid URL`)
        return {
            provider,
            model,
            base,
            token: "lmstudio",
            type: "openai",
            source: "env: JAN_API_...",
        }
    }

    if (provider === MODEL_PROVIDER_TRANSFORMERS) {
        return {
            provider,
            model,
            base: undefined,
            token: "transformers",
            source: "default",
        }
    }

    if (provider === MODEL_PROVIDER_CLIENT && host.clientLanguageModel) {
        return {
            provider,
            model,
            base: undefined,
            token: "client",
        }
    }

    return undefined

    function cleanAzureBase(b: string) {
        if (!b) return b
        b =
            trimTrailingSlash(b.replace(/\/openai\/deployments.*$/, "")) +
            `/openai/deployments`
        return b
    }

    function cleanApiBase(b: string) {
        if (!b) return b
        b = trimTrailingSlash(b)
        if (!/\/v1$/.test(b)) b += "/v1"
        return b
    }
}
