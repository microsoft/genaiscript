import { homedir } from "os"
import { existsSync, readFileSync } from "fs"
import { YAMLTryParse } from "./yaml"
import { JSON5TryParse } from "./json5"
import { DOT_ENV_FILENAME, TOOL_ID } from "./constants"
import { resolve } from "path"
import { validateJSONWithSchema } from "./schema"
import { HostConfiguration } from "./hostconfiguration"
import { structuralMerge } from "./merge"

export async function resolveGlobalConfiguration(
    dotEnvPath?: string
): Promise<HostConfiguration> {
    // ~/genaiscript.config.yml
    // ~/genaiscript.config.json
    const dirs = [homedir(), "."]
    const exts = ["yml", "yaml", "json"]

    // import and merge global local files
    let config: HostConfiguration = {}
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
                const validation = validateJSONWithSchema(parsed, {
                    type: "object",
                    properties: {
                        envFile: {
                            type: "string",
                        },
                    },
                })
                if (validation.schemaError)
                    throw new Error(
                        `Configuration error: ` + validation.schemaError
                    )
                config = structuralMerge(config, parsed)
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
    config.envFile = resolve(config.envFile)
    return config
}
