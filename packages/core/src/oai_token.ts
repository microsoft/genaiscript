import { AZURE_OPENAI_API_VERSION } from "./constants"
import { RequestError } from "./error"
import { OAIToken, host } from "./host"
import { fromBase64, logInfo, logWarn, utf8Decode } from "./util"

function validateTokenCore(token: string, quiet = false) {
    if (!token.startsWith("ey")) return

    let timeleft = 0
    const p = token.split(".")[1]
    try {
        const data = JSON.parse(utf8Decode(fromBase64(p)))
        timeleft = Math.round((data.exp * 1000 - Date.now()) / 1000)
        if (!quiet)
            logInfo(
                `token for: ${data.name} <${data.unique_name}>, valid for ${timeleft} seconds`
            )
    } catch (e) {
        throw new Error("invalid token structure")
    }
    if (timeleft < 60) throw new Error("token expired")
}

export async function initToken(template: ModelOptions, force = false) {
    const cfg = await host.getSecretToken(template)
    if (cfg && !force) {
        try {
            validateTokenCore(cfg.token)
            return cfg
        } catch (e) {
            logWarn(e.message)
        }
    }

    throw new RequestError(
        403,
        "token not specified",
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
}

export async function parseTokenFromEnv(
    env: Record<string, string>,
    template: ModelOptions
): Promise<OAIToken> {
    if (template.aici) {
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
            if (type === "azure") base += "/openai/deployments"
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
            const base =
                env.AZURE_OPENAI_ENDPOINT ||
                env.AZURE_OPENAI_API_BASE ||
                env.AZURE_API_BASE
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
