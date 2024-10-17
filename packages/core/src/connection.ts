import {
    AZURE_OPENAI_API_VERSION,
    DEFAULT_TEMPERATURE,
    DOCS_CONFIGURATION_AICI_URL,
    DOCS_CONFIGURATION_AZURE_OPENAI_URL,
    DOCS_CONFIGURATION_GITHUB_URL,
    DOCS_CONFIGURATION_LITELLM_URL,
    DOCS_CONFIGURATION_LLAMAFILE_URL,
    DOCS_CONFIGURATION_LOCALAI_URL,
    DOCS_CONFIGURATION_OLLAMA_URL,
    DOCS_CONFIGURATION_OPENAI_URL,
    DOT_ENV_FILENAME,
    GITHUB_MODELS_BASE,
    LITELLM_API_BASE,
    LLAMAFILE_API_BASE,
    LOCALAI_API_BASE,
    MODEL_PROVIDER_AZURE,
    MODEL_PROVIDER_AZURE_SERVERLESS,
    MODEL_PROVIDER_CLIENT,
    MODEL_PROVIDER_GITHUB,
    MODEL_PROVIDER_LITELLM,
    MODEL_PROVIDER_LLAMAFILE,
    MODEL_PROVIDER_OLLAMA,
    MODEL_PROVIDER_OPENAI,
    OLLAMA_API_BASE,
    OPENAI_API_BASE,
    PLACEHOLDER_API_BASE,
    PLACEHOLDER_API_KEY,
} from "./constants"
import { fileExists, readText, tryReadText, writeText } from "./fs"
import { APIType, host, LanguageModelConfiguration } from "./host"
import { parseModelIdentifier } from "./models"
import { normalizeFloat, trimTrailingSlash } from "./util"

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
    if (provider === MODEL_PROVIDER_OPENAI) {
        if (env.OPENAI_API_KEY || env.OPENAI_API_BASE || env.OPENAI_API_TYPE) {
            const token = env.OPENAI_API_KEY ?? ""
            let base = env.OPENAI_API_BASE
            let type =
                (env.OPENAI_API_TYPE as
                    | "azure"
                    | "openai"
                    | "localai"
                    | "azure_serverless") || "openai"
            const version = env.OPENAI_API_VERSION
            if (
                type !== "azure" &&
                type !== "openai" &&
                type !== "localai" &&
                type !== "azure_serverless"
            )
                throw new Error(
                    "OPENAI_API_TYPE must be 'azure', 'azure_serverless' or 'openai' or 'localai'"
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
                curlHeaders: {
                    Authorization: `Bearer $OPENAI_API_KEY`,
                },
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
            curlHeaders: {
                Authorization: `Bearer $${tokenVar}`,
            },
        }
    }

    if (provider === MODEL_PROVIDER_AZURE) {
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
            throw new Error("AZURE_OPENAI_ENDPOINT must be a valid URL")
        const version = env.AZURE_OPENAI_API_VERSION || env.AZURE_API_VERSION
        if (version && version !== AZURE_OPENAI_API_VERSION)
            throw new Error(
                `AZURE_OPENAI_API_VERSION must be '${AZURE_OPENAI_API_VERSION}'`
            )
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
            curlHeaders: tokenVar
                ? {
                      "api-key": `$${tokenVar}`,
                  }
                : undefined,
        }
    }

    if (provider === MODEL_PROVIDER_AZURE_SERVERLESS) {
        const tokenVar = "AZURE_INFERENCE_CREDENTIAL"
        const token = env[tokenVar]?.trim()
        const base = trimTrailingSlash(env.AZURE_INFERENCE_ENDPOINT)
        if (!token && !base) return undefined
        if (token === PLACEHOLDER_API_KEY)
            throw new Error("AZURE_INFERENCE_CREDENTIAL not configured")
        if (!base) throw new Error("AZURE_INFERENCE_ENDPOINT missing")
        if (base === PLACEHOLDER_API_BASE)
            throw new Error("AZURE_INFERENCE_ENDPOINT not configured")
        if (!URL.canParse(base))
            throw new Error("AZURE_INFERENCE_ENDPOINT must be a valid URL")
        const version = env.AZURE_INFERENCE_API_VERSION
        if (version && version !== AZURE_OPENAI_API_VERSION)
            throw new Error(
                `AZURE_INFERENCE_ENDPOINT must be '${AZURE_OPENAI_API_VERSION}'`
            )
        return {
            provider,
            model,
            base,
            token,
            type: "azure_serverless",
            source: "env: AZURE_INFERENCE_...",
            version,
            curlHeaders: tokenVar
                ? {
                      "api-key": `$${tokenVar}`,
                  }
                : undefined,
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
        const modelKey = prefix + "_API_KEY"
        const modelBase = prefix + "_API_BASE"
        if (env[modelKey] || env[modelBase]) {
            const token = env[modelKey] ?? ""
            const base = trimTrailingSlash(env[modelBase])
            const version = env[prefix + "_API_VERSION"]
            const source = `env: ${prefix}_API_...`
            const type: APIType = "openai"
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
                curlHeaders: token
                    ? {
                          Authorization: `Bearer $${modelKey}`,
                      }
                    : undefined,
            }
        }
    }

    if (provider === MODEL_PROVIDER_OLLAMA) {
        return {
            provider,
            model,
            base: OLLAMA_API_BASE,
            token: "ollama",
            type: "openai",
            source: "default",
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
        if (!b) return b
        b =
            trimTrailingSlash(b.replace(/\/openai\/deployments.*$/, "")) +
            `/openai/deployments`
        return b
    }
}

export async function updateConnectionConfiguration(
    provider?: string,
    apiType?: APIType
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
