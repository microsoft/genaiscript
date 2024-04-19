import { resolve } from "path/posix"
import { AICIModel } from "./aici"
import { LanguageModel } from "./chat"
import { DEFAULT_MODEL } from "./constants"
import { OAIToken, host } from "./host"
import { OpenAIModel } from "./openai"

export function resolveLanguageModel(
    family: "openai" | "aici",
    options?: {
        languageModel?: LanguageModel
    }
): LanguageModel {
    if (options?.languageModel) return options?.languageModel
    if (family === "aici") return AICIModel
    return OpenAIModel
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
