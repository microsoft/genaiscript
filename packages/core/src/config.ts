import { homedir } from "os"
import { existsSync, readFileSync } from "fs"
import { YAMLTryParse } from "./yaml"
import { JSON5TryParse } from "./json5"
import { DOT_ENV_FILENAME, MODEL_PROVIDERS, TOOL_ID } from "./constants"
import { resolve } from "path"
import { validateJSONWithSchema } from "./schema"
import { HostConfiguration } from "./hostconfiguration"
import { structuralMerge } from "./merge"
import {
    LanguageModelConfiguration,
    LanguageModelInfo,
    ResolvedLanguageModelConfiguration,
} from "./server/messages"
import { parseTokenFromEnv } from "./connection"
import { resolveLanguageModel } from "./lm"
import { deleteEmptyValues } from "./cleaners"
import { errorMessage } from "./error"
import schema from "../../../docs/public/schemas/config.json"
import defaultConfig from "./config.json"

export async function resolveGlobalConfiguration(
    dotEnvPath?: string
): Promise<HostConfiguration> {
    // ~/genaiscript.config.yml
    // ~/genaiscript.config.json
    const dirs = [homedir(), "."]
    const exts = ["yml", "yaml", "json"]

    // import and merge global local files
    let config: HostConfiguration = structuredClone(defaultConfig)
    delete (config as any)["$schema"]
    for (const dir of dirs) {
        for (const ext of exts) {
            const filename = resolve(`${dir}/${TOOL_ID}.config.${ext}`)
            if (existsSync(filename)) {
                const fileContent = readFileSync(filename, "utf8")
                const parsed =
                    ext === "yml" || ext === "yaml"
                        ? YAMLTryParse(fileContent)
                        : JSON5TryParse(fileContent)
                if (!parsed)
                    throw new Error(
                        `Configuration error: failed to parse ${filename}`
                    )
                const validation = validateJSONWithSchema(
                    parsed,
                    schema as JSONSchema
                )
                if (validation.schemaError)
                    throw new Error(
                        `Configuration error: ` + validation.schemaError
                    )
                config = deleteEmptyValues({
                    include: structuralMerge(
                        config?.include || [],
                        parsed?.include || []
                    ),
                    envFile: parsed?.envFile || config?.envFile,
                    modelAliases: structuralMerge(
                        config?.modelAliases || {},
                        parsed?.modelAliases || {}
                    ),
                    modelEncodings: structuralMerge(
                        config?.modelEncodings || {},
                        parsed?.modelEncodings || {}
                    ),
                    secretScanners: structuralMerge(
                        config?.secretScanners || {},
                        parsed?.secretScanners || {}
                    ),
                })
            }
        }
    }

    // import for env var
    if (process.env.GENAISCRIPT_ENV_FILE)
        config.envFile = process.env.GENAISCRIPT_ENV_FILE

    // override with CLI command
    if (dotEnvPath) config.envFile = dotEnvPath

    if (config.envFile) {
        // if the user provided a path, check file existence
        if (!(await existsSync(config.envFile)))
            throw new Error(`.env file not found at ${config.envFile}`)
    } else {
        config.envFile = DOT_ENV_FILENAME
    }
    if (config.envFile) config.envFile = resolve(config.envFile)

    return config
}

/**
 * Outputs environment information for model providers.
 * @param provider - The specific provider to filter by (optional).
 * @param options - Configuration options, including whether to show tokens.
 */
export async function resolveLanguageModelConfigurations(
    provider: string,
    options?: { token?: boolean; error?: boolean; models?: boolean }
): Promise<ResolvedLanguageModelConfiguration[]> {
    const { token, error, models } = options || {}
    const res: ResolvedLanguageModelConfiguration[] = []
    const env = process.env

    // Iterate through model providers, filtering if a specific provider is given
    for (const modelProvider of MODEL_PROVIDERS.filter(
        (mp) => !provider || mp.id === provider
    )) {
        try {
            // Attempt to parse connection token from environment variables
            const conn: LanguageModelConfiguration & {
                models?: LanguageModelInfo[]
            } = await parseTokenFromEnv(env, `${modelProvider.id}:*`)
            if (conn) {
                // Mask the token if the option is set
                let listError = ""
                if (!token && conn.token) conn.token = "***"
                if (models) {
                    const lm = await resolveLanguageModel(modelProvider.id)
                    if (lm.listModels) {
                        const models = await lm.listModels(conn, {})
                        if (models.ok) conn.models = models.models
                        else
                            listError =
                                errorMessage(listError) ||
                                "failed to llist models"
                    }
                }
                if (!listError || error)
                    res.push(
                        deleteEmptyValues({
                            provider: conn.provider,
                            source: conn.source,
                            base: conn.base,
                            type: conn.type,
                            models: conn.models,
                            error: listError,
                        })
                    )
            }
        } catch (e) {
            if (error)
                // Capture and store any errors encountered
                res.push({
                    provider: modelProvider.id,
                    error: errorMessage(e),
                })
        }
    }
    return res.sort((l, r) => l.provider.localeCompare(r.provider))
}
