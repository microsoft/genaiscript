import { select, input, confirm, password } from "@inquirer/prompts"
import { MODEL_PROVIDERS } from "../../core/src/constants"
import { resolveLanguageModelConfigurations } from "../../core/src/config"
import { parse } from "dotenv"
import { writeFile } from "fs/promises"
import { runtimeHost } from "../../core/src/host"
import { deleteUndefinedValues } from "../../core/src/cleaners"
import { logInfo, logVerbose, logWarn } from "../../core/src/util"
import { run } from "./api"
import { tryReadText } from "../../core/src/fs"

export async function configure(options: { provider?: string }) {
    while (true) {
        const provider = options?.provider
            ? MODEL_PROVIDERS.find(({ id }) => options.provider === id)
            : await select({
                  message: "Select a LLM provider to configure",
                  choices: MODEL_PROVIDERS.filter(({ hidden }) => !hidden).map(
                      (provider) => ({
                          name: provider.detail,
                          value: provider,
                          description: `'${provider.id}': https://microsoft.github.io/genaiscript/getting-started/configuration#${provider.id}`,
                      })
                  ),
              })
        if (!provider) break

        logInfo(`configurating ${provider.id} (${provider.detail})`)
        logVerbose(
            `- docs: https://microsoft.github.io/genaiscript/getting-started/configuration#${provider.id}`
        )
        while (true) {
            const config = await runtimeHost.readConfig()
            logVerbose(`- env file: ${config.envFile[0]}`)
            const envText = (await tryReadText(config.envFile[0])) || ""
            const env = parse(envText)
            const conn = (
                await resolveLanguageModelConfigurations(provider.id, {
                    token: false,
                    error: true,
                    models: true,
                })
            )?.[0]
            if (conn) {
                const { error, models, ...rest } = conn
                logInfo("")
                logInfo(
                    YAML.stringify(
                        deleteUndefinedValues({
                            configuration: deleteUndefinedValues({
                                ...rest,
                                models: models?.length ?? undefined,
                            }),
                        })
                    )
                )
                if (error) logWarn(`error: ${error}`)
                else logInfo(`configuration found!`)
            } else {
                logWarn(`no configuration found`)
            }
            if (!provider.env) {
                logInfo(
                    `sorry, this provider is not yet configurable through the cli`
                )
                break
            }
            const envVars = Object.entries(provider.env)
            if (!envVars.length) {
                logInfo(`this provider does not have configuration flags`)
                break
            }

            if (!conn?.error) {
                const test = await confirm({
                    message: `do you want to test the configuration?`,
                })
                if (test) {
                    const res = await run("configuration-tester", [], {
                        jsSource: `script({
    unlisted: true,
    system: [],
    systemSafety: false,
})
$\`Write a one-word poem in code.\`
`,
                        provider: provider.id,
                        runTrace: false,
                    })
                    process.stderr.write("\n")
                    if (!res || res.error) logWarn(`chat error!`)
                    else logInfo(`chat successful!`)
                }

                const edit = await confirm({
                    message: `do you want to edit the configuration?`,
                })
                if (!edit) break
            }
            for (const ev of envVars) {
                const [name, info] = ev
                const oldValue = env[name]
                let value = oldValue
                if (value) {
                    const edit = await confirm({
                        message: `found a value for ${name}, do you want to edit?`,
                    })
                    if (!edit) continue
                }
                if (info.description) logVerbose(`${name}: ${info.description}`)
                if (info.secret) {
                    value = await password({
                        message: `enter a value for ${name}`,
                        mask: false,
                    })
                } else if (info.enum) {
                    value = await select({
                        message: `select a value for ${name}`,
                        default: value,
                        choices: info.enum.map((v) => ({
                            name: v,
                            value: v,
                        })),
                    })
                } else {
                    value = await input({
                        message: `enter a value for ${name}`,
                        default: value,
                        required: info.required,
                        theme: {
                            validationFailureMode: "keep",
                        },
                        validate: (v) => {
                            console.log(v)
                            if (info.format === "url") {
                                if (v && !URL.canParse(v)) return "invalid url"
                            }
                            return true
                        },
                    })
                }
                if (value === "") continue
                if (value !== oldValue)
                    await patchEnvFile(config.envFile[0], name, value)
            }
        }
    }
}

async function patchEnvFile(filePath: string, key: string, value: string) {
    logVerbose(`patching ${filePath}, ${key}`)

    const fileContent = (await tryReadText(filePath)) || ""
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
