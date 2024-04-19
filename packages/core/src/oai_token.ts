import { AZURE_OPENAI_API_VERSION } from "./constants"
import { RequestError } from "./error"
import { OAIToken, host } from "./host"
import { fromBase64, logInfo, logWarn, utf8Decode } from "./util"


export async function initToken(options: ModelConnectionOptions) {
    const cfg = await host.getSecretToken(options)
    if (!cfg)
        throw new RequestError(
            403,
            "token not configured",
            {
                type: "no_token",
                message:
                    "token not configured, see https://microsoft.github.io/genaiscript/reference/token/",
                param: undefined,
                code: "no_token",
            },
            '{ code: "no_token" }',
            -1
        )

    return cfg
}

function trimTrailingSlash(s: string) {
    return s?.replace(/\/+$/, "")
}

export async function parseTokenFromEnv(
    env: Record<string, string>,
    options: ModelConnectionOptions
): Promise<OAIToken> {
    if (options.aici) {
        if (env.AICI_API_BASE) {
            const base = env.AICI_API_BASE
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
    } else {
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
                throw new Error("OPENAI_API_TYPE must be 'azure' or 'local'")
            if (type === "azure" && !base)
                throw new Error("OPENAI_API_BASE not set")
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
                source: "env: OPENAI_...",
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
                    "AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_API_BASE or AZURE_API_BASE not set"
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
    }
    return undefined
}
