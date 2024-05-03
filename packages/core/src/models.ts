import { AICIModel } from "./aici"
import { LanguageModel } from "./chat"
import { DEFAULT_MODEL } from "./constants"
import { errorMessage } from "./error"
import { OAIToken, host } from "./host"
import { OllamaModel } from "./ollama"
import { OpenAIModel } from "./openai"

export function resolveLanguageModel(
    template: ModelOptions,
    options?: {
        languageModel?: LanguageModel
    }
): LanguageModel {
    if (options?.languageModel) return options?.languageModel
    const { provider } = parseModelIdentifier(template?.model)
    if (provider === "ollama") return OllamaModel
    if (provider === "aici") return AICIModel
    return OpenAIModel
}

/**
 * model
 * provider:model
 * provider:model:size where modelId model:size
 */
export function parseModelIdentifier(id: string) {
    id = (id ?? DEFAULT_MODEL).replace("-35-", "-3.5-")
    const parts = id.split(":")
    if (parts.length >= 3)
        return {
            provider: parts[0],
            model: parts[1],
            tag: parts.slice(2).join(":"),
            modelId: parts.slice(1).join(":"),
        }
    else if (parts.length === 2)
        return { provider: parts[0], model: parts[1], modelId: parts[1] }
    else return { provider: "openai", model: id, modelId: id }
}

export interface ModelConnectionInfo
    extends ModelConnectionOptions,
        Partial<OAIToken> {
    error?: string
}

export async function resolveModelConnectionInfo(
    conn: ModelConnectionOptions,
    options?: { token?: boolean }
): Promise<{ info: ModelConnectionInfo; token?: OAIToken }> {
    try {
        const token = await host.getSecretToken(conn)
        if (!token) {
            return { info: { ...conn, error: "token not configured" } }
        } else {
            const { token: theToken, ...rest } = token
            return {
                info: {
                    ...conn,
                    ...rest,
                    token: theToken ? (options?.token ? theToken : "***") : "",
                },
                token,
            }
        }
    } catch (e) {
        return {
            info: {
                ...conn,
                error: errorMessage(e),
            },
        }
    }
}
