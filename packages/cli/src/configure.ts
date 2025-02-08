import { select, input, confirm, password } from "@inquirer/prompts"
import { MODEL_PROVIDERS } from "../../core/src/constants"
import { resolveLanguageModelConfigurations } from "../../core/src/config"
import { parse } from "dotenv"
import { readFile } from "fs/promises"
import { writeFile } from "fs/promises"
import { runtimeHost } from "../../core/src/host"
import { deleteUndefinedValues } from "../../core/src/cleaners"

export async function configure(options: { provider?: string }) {
    while (true) {
        const provider = options?.provider
            ? MODEL_PROVIDERS.find(({ id }) => options.provider === id)
            : await select({
                  message: "Select a LLM provider to configure",
                  choices: MODEL_PROVIDERS.map((provider) => ({
                      name: provider.id,
                      value: provider,
                      description: provider.detail,
                  })),
              })
        if (!provider) break

        console.log(`configurating ${provider.id} (${provider.detail})`)
        console.debug(
            `- docs: https://microsoft.github.io/genaiscript/getting-started/configuration#${provider.id}`
        )
        while (true) {
            const config = await runtimeHost.readConfig()
            const env = parse(await readFile(config.envFile, "utf-8"))
            const conn = (
                await resolveLanguageModelConfigurations(provider.id, {
                    token: false,
                    error: true,
                    models: true,
                })
            )?.[0]
            if (conn) {
                const { error, models, ...rest } = conn
                console.log("")
                console.debug(
                    YAML.stringify(
                        deleteUndefinedValues({
                            configuration: deleteUndefinedValues({
                                ...rest,
                                models: models?.length ?? undefined,
                            }),
                            error,
                        })
                    )
                )
            } else {
                console.warn(`no configuration found`)
            }
            if (!provider.env) {
                console.log(
                    `sorry, this provider is not yet configurable through the cli`
                )
                break
            }
            if (!conn?.error) {
                const edit = await confirm({
                    message: `do you want to edit the configuration?`,
                })
                if (!edit) break
            }
            for (const ev of Object.entries(provider.env)) {
                const [name, info] = ev
                let value = env[name]
                if (value) {
                    const edit = await confirm({
                        message: `found a value for ${name}, do you want to edit?`,
                    })
                    if (!edit) continue
                }
                if (info.secret) {
                    value = await password({
                        message: `enter a value for ${name}`,
                    })
                } else {
                    value = await input({
                        message: `enter a value for ${name}`,
                        default: value,
                        required: info.required,
                    })
                }
                if (value === "") continue

                await patchEnvFile(config.envFile, name, value)
            }
        }
    }
}

async function patchEnvFile(filePath: string, key: string, value: string) {
    const fileContent = await readFile(filePath, "utf-8")
    const lines = fileContent.split("\n")
    let found = false

    const updatedLines = lines.map((line) => {
        if (line.startsWith(`${key}=`)) {
            found = true
            return `${key}=${value}`
        }
        return line
    })

    if (!found) {
        updatedLines.push(`${key}=${value}`)
    }

    await writeFile(filePath, updatedLines.join("\n"), "utf-8")
}
