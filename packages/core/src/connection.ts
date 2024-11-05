import {
    ANTHROPIC_API_BASE,
    AZURE_AI_INFERENCE_VERSION,
    AZURE_OPENAI_API_VERSION,
    DOT_ENV_FILENAME,
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
} from "./constants"
import { fileExists, readText, writeText } from "./fs"
import {
    OpenAIAPIType,
    host,
    LanguageModelConfiguration,
    AzureCredentialsType,
} from "./host"
import { parseModelIdentifier } from "./models"
import { parseHostVariable } from "./ollama"
import { normalizeFloat, trimTrailingSlash } from "./util"

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
    if (env.GENAISCRIPT_DEFAULT_MODEL)
        host.defaultModelOptions.model = env.GENAISCRIPT_DEFAULT_MODEL
    if (env.GENAISCRIPT_DEFAULT_SMALL_MODEL)
        host.defaultModelOptions.smallModel =
            env.GENAISCRIPT_DEFAULT_SMALL_MODEL
    const t = normalizeFloat(env.GENAISCRIPT_DEFAULT_TEMPERATURE)
    if (!isNaN(t)) host.defaultModelOptions.temperature = t
    if (env.GENAISCRIPT_DEFAULT_EMBEDDINGS_MODEL)
        host.defaultEmbeddingsModelOptions.embeddingsModel =
            env.GENAISCRIPT_DEFAULT_EMBEDDINGS_MODEL
}

export async function parseTokenFromEnv(
    env: Record<string, string>,
    modelId: string
): Promise<LanguageModelConfiguration> {
    const { provider, model, tag } = parseModelIdentifier(
        modelId ?? host.defaultModelOptions.model
    )
    const TOKEN_SUFFIX = ["_API_KEY", "_API_TOKEN", "_TOKEN", "_KEY"]
    const BASE_SUFFIX = ["_API_BASE", "_API_ENDPOINT", "_BASE", "_ENDPOINT"]

    if (provider === MODEL_PROVIDER_OPENAI) {
        if (env.OPENAI_API_KEY || env.OPENAI_API_BASE || env.OPENAI_API_TYPE) {
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
                throw new Error(
                    "OPENAI_API_BASE must be set when type is 'azure'"
                )
            if (type === "azure") base = cleanAzureBase(base)
            if (
                type === "azure" &&
                version &&
                version !== AZURE_OPENAI_API_VERSION
            )
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
            }
        }
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
        }
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
        }
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
        }
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
        base = cleanAzureBase(base)
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
        }
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
        }
    }

    if (provider === MODEL_PROVIDER_OLLAMA) {
        const host = parseHostVariable(env)
        const base = cleanApiBase(host)
        return {
            provider,
            model,
            base,
            token: "ollama",
            type: "openai",
            source: "env: OLLAMA_HOST",
        }
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
        return {
            provider,
            model,
            base: LLAMAFILE_API_BASE,
            token: "llamafile",
            type: "openai",
            source: "default",
        }
    }

    if (provider === MODEL_PROVIDER_LITELLM) {
        return {
            provider,
            model,
            base: LITELLM_API_BASE,
            token: "litellm",
            type: "openai",
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
        if (!b || !/\.openai\.azure\.com/i.test(b)) return b
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

export async function updateConnectionConfiguration(
    provider?: string,
    apiType?: OpenAIAPIType
): Promise<void> {
    // update .gitignore file
    if (!(await fileExists(".gitignore")))
        await writeText(".gitignore", `${DOT_ENV_FILENAME}\n`)
    else {
        const content = await readText(".gitignore")
        if (!content.includes(DOT_ENV_FILENAME))
            await writeText(".gitignore", content + `\n${DOT_ENV_FILENAME}\n`)
    }
}
