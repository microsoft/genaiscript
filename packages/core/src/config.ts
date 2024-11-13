import { PromptScriptRunOptions } from "./server/messages"
import { homedir } from "os"
import { existsSync, readFileSync } from "fs"
import { YAMLTryParse } from "./yaml"
import { JSON5TryParse } from "./json5"
import mergeDescriptors from "merge-descriptors"
import { TOOL_ID } from "./constants"
import { HostConfiguration } from "./host"

export async function resolveGlobalConfiguration(): Promise<HostConfiguration> {
    // ~/genaiscript.config.yml
    // ~/genaiscript.config.json
    const dirs = [homedir(), "."]
    const exts = ["yml", "yaml", "json"]

    // import and merge gobal local files
    let config: HostConfiguration = {}
    for (const dir of dirs) {
        for (const ext of exts) {
            const filename = `${dir}/${TOOL_ID}.config.${ext}`
            if (existsSync(filename)) {
                const fileContent = readFileSync(filename, "utf8")
                const parsed =
                    ext === "yml"
                        ? YAMLTryParse(fileContent)
                        : JSON5TryParse(fileContent)
                if (parsed) {
                    config = mergeDescriptors(config, parsed)
                }
            }
        }
    }

    // import for env var
    if (process.env.GENAISCRIPT_ENV_FILE)
        config.envFile = process.env.GENAISCRIPT_ENV_FILE

    return config
}
