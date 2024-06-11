import {
    AZURE_OPENAI_API_VERSION,
    DOCS_CONFIGURATION_AICI_URL,
    DOCS_CONFIGURATION_AZURE_OPENAI_URL,
    DOCS_CONFIGURATION_LITELLM_URL,
    DOCS_CONFIGURATION_LLAMAFILE_URL,
    DOCS_CONFIGURATION_LOCALAI_URL,
    DOCS_CONFIGURATION_OLLAMA_URL,
    DOCS_CONFIGURATION_OPENAI_URL,
    LITELLM_API_BASE,
    LLAMAFILE_API_BASE,
    LOCALAI_API_BASE,
    MODEL_PROVIDER_AICI,
    MODEL_PROVIDER_AZURE,
    MODEL_PROVIDER_LITELLM,
    MODEL_PROVIDER_LLAMAFILE,
    MODEL_PROVIDER_OLLAMA,
    MODEL_PROVIDER_OPENAI,
    OLLAMA_API_BASE,
    OPENAI_API_BASE,
} from "./constants"
import { fileExists, readText, writeText } from "./fs"
import { APIType, LanguageModelConfiguration } from "./host"
import { parseModelIdentifier } from "./models"
import { trimTrailingSlash } from "./util"

export async function parseTokenFromEnv(
    env: Record<string, string>,
    modelId: string
): Promise<LanguageModelConfiguration> {
    const { provider, model, tag } = parseModelIdentifier(modelId)

    if (provider === MODEL_PROVIDER_OPENAI) {
        if (env.OPENAI_API_KEY || env.OPENAI_API_BASE || env.OPENAI_API_TYPE) {
            const token = env.OPENAI_API_KEY ?? ""
            let base = env.OPENAI_API_BASE
            let type =
                (env.OPENAI_API_TYPE as "azure" | "openai" | "localai") ||
                "openai"
            const version = env.OPENAI_API_VERSION
            if (type !== "azure" && type !== "openai" && type !== "localai")
                throw new Error(
                    "OPENAI_API_TYPE must be 'azure' or 'openai' or 'localai'"
                )
            if (type === "openai" && !base) base = OPENAI_API_BASE
            if (type === "localai" && !base) base = LOCALAI_API_BASE
            if (type === "azure" && !base)
                throw new Error(
                    "OPENAI_API_BASE must be set when type is 'azure'"
                )
            if (type === "azure")
                base = trimTrailingSlash(base) + "/openai/deployments"
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
                throw new Error("OPEN_API_KEY missing")
            if (base && !URL.canParse(base))
                throw new Error("OPENAI_API_BASE must be a valid URL")
            return {
                provider,
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

    if (provider === MODEL_PROVIDER_AZURE) {
        const tokenVar = env.AZURE_OPENAI_API_KEY
            ? "AZURE_OPENAI_API_KEY"
            : env.AZURE_API_KEY
        const token = env[tokenVar]
        let base = trimTrailingSlash(
            env.AZURE_OPENAI_ENDPOINT ||
                env.AZURE_OPENAI_API_BASE ||
                env.AZURE_API_BASE ||
                env.AZURE_OPENAI_API_ENDPOINT
        )
        if (token || base) {
            if (!base)
                throw new Error(
                    "AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_BASE or AZURE_API_BASE missing"
                )
            if (!URL.canParse(base))
                throw new Error("AZURE_OPENAI_ENDPOINT must be a valid URL")
            const version =
                env.AZURE_OPENAI_API_VERSION || env.AZURE_API_VERSION
            if (version && version !== AZURE_OPENAI_API_VERSION)
                throw new Error(
                    `AZURE_OPENAI_API_VERSION must be '${AZURE_OPENAI_API_VERSION}'`
                )
            if (!base.endsWith("/openai/deployments"))
                base += "/openai/deployments"
            return {
                provider,
                base,
                token,
                type: "azure",
                source: token ? "env: AZURE_..." : "env: AZURE_... + Entra ID",
                version,
                curlHeaders: tokenVar
                    ? {
                          "api-key": `$${tokenVar}`,
                      }
                    : undefined,
            }
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
            base: OLLAMA_API_BASE,
            token: "ollama",
            type: "openai",
            source: "default",
        }
    }

    if (provider === MODEL_PROVIDER_LLAMAFILE) {
        return {
            provider,
            base: LLAMAFILE_API_BASE,
            token: "llamafile",
            type: "openai",
            source: "default",
        }
    }

    if (provider === MODEL_PROVIDER_LITELLM) {
        return {
            provider,
            base: LITELLM_API_BASE,
            token: "litellm",
            type: "openai",
            source: "default",
        }
    }

    return undefined
}

export function dotEnvTemplate(provider: string, apiType: APIType) {
    if (provider === MODEL_PROVIDER_OLLAMA)
        return `
## Ollama ${DOCS_CONFIGURATION_OLLAMA_URL}
# OLLAMA_API_BASE="<custom api base>" # uses ${OLLAMA_API_BASE} by default
`

    if (provider === MODEL_PROVIDER_LLAMAFILE)
        return `
## llamafile ${DOCS_CONFIGURATION_LLAMAFILE_URL}
# There is no configuration for llamafile
`

    if (provider === MODEL_PROVIDER_LITELLM)
        return `
## LiteLLM ${DOCS_CONFIGURATION_LITELLM_URL}
# LITELLM_API_BASE="<custom api base>" # uses ${LITELLM_API_BASE} by default
`

    if (provider === MODEL_PROVIDER_AICI)
        return `
## AICI ${DOCS_CONFIGURATION_AICI_URL}
AICI_API_BASE="<custom api base>"
`

    if (apiType === "azure" || provider === MODEL_PROVIDER_AZURE)
        return `
## Azure OpenAI ${DOCS_CONFIGURATION_AZURE_OPENAI_URL}
AZURE_OPENAI_ENDPOINT="<your api endpoint>"
# AZURE_OPENAI_API_KEY="<your token>"
`

    if (apiType === "localai")
        return `
## LocalAI ${DOCS_CONFIGURATION_LOCALAI_URL}
OPENAI_API_TYPE="localai"
# OPENAI_API_KEY="<your token>" # use if you have an access token in the localai web ui
# OPENAI_API_BASE="<api end point>" # uses ${LOCALAI_API_BASE} by default
`

    return `
## OpenAI ${DOCS_CONFIGURATION_OPENAI_URL}
OPENAI_API_KEY="<your token>"
# OPENAI_API_BASE="<api end point>" # uses ${OPENAI_API_BASE} by default
`
}

export async function updateConnectionConfiguration(
    provider?: string,
    apiType?: APIType
): Promise<void> {
    // update .gitignore file
    if (!(await fileExists(".gitignore")))
        await writeText(".gitignore", ".env\n")
    else {
        const content = await readText(".gitignore")
        if (!content.includes(".env"))
            await writeText(".gitignore", content + "\n.env\n")
    }

    // update .env
    let src = dotEnvTemplate(provider, apiType)
    if (await fileExists(".env")) src = (await readText(".env")) + "\n" + src
    await writeText(".env", src)
}
