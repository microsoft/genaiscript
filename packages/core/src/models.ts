import { AICIModel } from "./aici"
import { LanguageModel } from "./chat"
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
    else if (template.aici) return AICIModel
    const { provider, model } = parseModelIdentifier(template.model)
    if (provider === "ollama") return OllamaModel
    return OpenAIModel
}

export function parseModelIdentifier(id: string) {
    let provider = "openai"
    let model = id || "gpt-4"
    const i = id?.indexOf(":")
    if (i > -1) {
        provider = id.substring(0, i).toLowerCase()
        model = id.substring(i + 1)
    }

    model = model.replace("-35-", "-3.5-")

    return { provider, model }
}

export type ModelConnectionInfo = ModelConnectionOptions &
    Partial<OAIToken> & { error?: string }

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
                error: (e as Error).message || e + "",
            },
        }
    }
}
