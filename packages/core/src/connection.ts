import {
    AZURE_OPENAI_API_VERSION,
    DOCS_CONFIGURATION_URL,
    LOCALAI_API_BASE,
    MODEL_PROVIDER_OLLAMA,
    MODEL_PROVIDER_OPENAI,
    OLLAMA_API_BASE,
    OPENAI_API_BASE,
} from "./constants"
import { fileExists, readText, writeText } from "./fs"
import { APIType, OAIToken } from "./host"
import { parseModelIdentifier } from "./models"
import { trimTrailingSlash } from "./util"

export async function parseTokenFromEnv(
    env: Record<string, string>,
    options: ModelConnectionOptions
): Promise<OAIToken> {
    const { provider, model, tag } = parseModelIdentifier(options.model)

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
            return {
                base,
                type,
                token,
                source: "env: OPENAI_API_...",
                version,
            }
        }

        if (
            env.AZURE_OPENAI_API_KEY ||
            env.AZURE_API_KEY ||
            env.AZURE_OPENAI_ENDPOINT
        ) {
            const token =
                env.AZURE_OPENAI_API_KEY ||
                env.AZURE_API_KEY ||
                env.OPENAI_API_KEY
            let base = trimTrailingSlash(
                env.AZURE_OPENAI_ENDPOINT ||
                    env.AZURE_OPENAI_API_BASE ||
                    env.AZURE_API_BASE ||
                    env.AZURE_OPENAI_API_ENDPOINT
            )
            const version =
                env.AZURE_OPENAI_API_VERSION ||
                env.AZURE_API_VERSION ||
                env.OPENAI_API_VERSION
            if (!base)
                throw new Error(
                    "AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_BASE or AZURE_API_BASE missing"
                )
            if (version && version !== AZURE_OPENAI_API_VERSION)
                throw new Error(
                    `AZURE_OPENAI_API_VERSION must be '${AZURE_OPENAI_API_VERSION}'`
                )
            if (!token) throw new Error("AZURE_OPENAI_API_KEY missing")
            if (!base.endsWith("/openai/deployments"))
                base += "/openai/deployments"
            return {
                base,
                token,
                type: "azure",
                source: "env: AZURE_...",
                version,
            }
        }
    } else {
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
                return { token, base, type, version, source }
            }
        }

        // default connection location
        if (provider === MODEL_PROVIDER_OLLAMA) {
            return {
                base: OLLAMA_API_BASE,
                token: "ollama",
                type: "openai",
                source: "default",
            }
        }
    }
    return undefined
}

export function dotEnvTemplate(provider?: string, apiType?: APIType) {
    const active = (v: boolean) => (!v ? "# " : "")
    const res = `# GenAIScript configuration (${DOCS_CONFIGURATION_URL})

## OpenAI
${active(provider === MODEL_PROVIDER_OPENAI && apiType !== "azure")}OPENAI_API_KEY="<your token>"
# OPENAI_API_BASE="<api end point>" # uses ${OPENAI_API_BASE} by default

## Azure OpenAI
${active(provider === MODEL_PROVIDER_OPENAI && apiType === "azure")}AZURE_OPENAI_ENDPOINT="<your api endpoint>"
${active(provider === MODEL_PROVIDER_OPENAI && apiType === "azure")}AZURE_OPENAI_API_KEY="<your token>"

## Ollama
# OLLAMA_API_BASE="<custom api base>" # uses ${OLLAMA_API_BASE} by default

## LocalAI
${active(provider === MODEL_PROVIDER_OPENAI && apiType === "localai")}OPENAI_API_TYPE="localai"
# set OPENAI_API_KEY if you configured an access token in the localai web editor
# set OPENAI_API_BASE if you are using a different port than ${LOCALAI_API_BASE}
`
    return res
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
    if (!(await fileExists(".env"))) {
        const src = dotEnvTemplate(provider, apiType)
        await writeText(".env", src)
    } else {
        // else patch
    }
}
