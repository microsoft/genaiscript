import { select, input, confirm, password } from "@inquirer/prompts"
import { MODEL_PROVIDERS } from "../../core/src/constants"
import { resolveLanguageModelConfigurations } from "../../core/src/config"
import { parse } from "dotenv"
import { readFile } from "fs/promises"

export async function configure() {
    const envFile = ".env"
    const env = parse(await readFile(envFile, "utf-8"))

    const provider = await select({
        message: "Select a LLM provider to configure",
        choices: MODEL_PROVIDERS.map((provider) => ({
            name: provider.id,
            value: provider,
            description: provider.detail,
        })),
    })
    if (!provider) return

    while (true) {
        const { error, ...rest } =
            (
                await resolveLanguageModelConfigurations(provider.id, {
                    token: false,
                    error: true,
                    models: true,
                })
            )?.[0] || {}
        console.debug(YAML.stringify(rest))
        if (error) console.warn(error)
        if (!provider.env) break
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
                value = await input({
                    message: `enter a value for ${name}`,
                    default: value,
                    required: info.required,
                })
            } else {
                value = await password({
                    message: `enter a value for ${name}`,
                })
            }
            if (value === "" || value) {
                env[name] = value
                process.env[name] = value
                // patch .env file
            }
        }
    }
}
