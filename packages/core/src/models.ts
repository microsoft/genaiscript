import { AICIModel } from "./aici"
import { LanguageModel } from "./chat"
import { DEFAULT_MODEL } from "./constants"
import { host } from "./host"
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



export async function resolveModelTokens(templates: PromptTemplate[], options?: { token?: boolean }) {
    const models: Record<string, ModelConnectionOptions> = {}
    for (const template of templates) {
        const conn: ModelConnectionOptions = { model: template.model ?? DEFAULT_MODEL, aici: template.aici }
        const key = JSON.stringify(conn)
        models[key] = conn
    }
    const res = []
    for (const conn of Object.values(models)) {
        try {
            const tok = await host.getSecretToken(conn)
            if (!tok) {
                res.push(conn)
            }
            else {
                const { token, ...rest } = tok
                res.push({
                    ...conn,
                    ...rest,
                    token: token ? (options?.token ? token : "***") : ""
                })
            }
        } catch (e) {
            res.push({
                ...conn,
                error: (e as Error).message || (e + "")
            })
        }
    }
    return res
}