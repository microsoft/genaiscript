import { AZURE_OPENAI_API_VERSION } from "./constants"
import { OAIToken } from "./host"
import { parseModelIdentifier } from "./models"
import { trimTrailingSlash } from "./util"

export async function parseTokenFromEnv(
    env: Record<string, string>,
    options: ModelConnectionOptions
): Promise<OAIToken> {
    const { aici } = options
    const { provider, model } = parseModelIdentifier(options.model)

    if (aici) {
        if (env.AICI_API_BASE) {
            const base = trimTrailingSlash(env.AICI_API_BASE)
            const token = env.AICI_API_KEY
            const version = env.AICI_API_VERSION ?? "v1"
            return {
                base,
                token,
                aici: true,
                source: "env: AICI_...",
                version,
            }
        }
    } else if (provider === "openai") {
        if (env.OPENAI_API_KEY || env.OPENAI_API_BASE) {
            const token = env.OPENAI_API_KEY ?? ""
            let base = env.OPENAI_API_BASE
            let type = env.OPENAI_API_TYPE as "azure" | "local" | "openai"
            const version = env.OPENAI_API_VERSION
            if (
                type &&
                type !== "azure" &&
                type !== "local" &&
                type !== "openai"
            )
                throw new Error(
                    "OPENAI_API_TYPE must be 'azure', 'openai', or 'local'"
                )
            if (type === "azure" && !base)
                throw new Error(
                    "OPENAI_API_BASE must be set when type is 'azure'"
                )
            if (!type && /http:\/\/localhost:\d+/.test(base)) type = "local"
            if (
                type === "azure" &&
                version &&
                version !== AZURE_OPENAI_API_VERSION
            )
                throw new Error(
                    `OPENAI_API_VERSION must be '${AZURE_OPENAI_API_VERSION}'`
                )
            if (!type) type = "openai" // default
            if (type === "local") {
                return {
                    base,
                    token,
                    type,
                    source: "env: OPENAI_API_...",
                    version,
                }
            }
            if (!token) throw new Error("OPEN_API_KEY missing")
            if (type === "openai") base ??= "https://api.openai.com/v1/"
            else if (type === "azure")
                base = trimTrailingSlash(base) + "/openai/deployments"
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
        const prefixes = [`${provider}_${model}`, provider].map((p) =>
            p.toUpperCase().replace(/[^a-z0-9]+/gi, "_")
        )
        for (const prefix of prefixes) {
            const modelKey = prefix + "_API_KEY"
            const modelBase = prefix + "_API_BASE"
            if (env[modelKey] || env[modelBase]) {
                const token = env[modelKey] ?? ""
                const base = trimTrailingSlash(env[modelBase])
                const version = env[prefix + "_API_VERSION"]
                const source = `env: ${prefix}_API_...`
                return { token, base, version, source }
            }
        }
    }
    return undefined
}
