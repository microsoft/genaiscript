import { promisify } from "node:util"
import { exec } from "node:child_process"

const execAsync = promisify(exec)

// https://promptfoo.dev/docs/providers/custom-api
// https://github.com/promptfoo/promptfoo/blob/335bdab1049659f08349c14814f0bc0fac35daeb/src/providers/azureopenai.ts#L72
class GenAIScriptApiProvider {
    constructor(options) {
        this.config = options.config
        this.providerId =
            options.id || `genaiscript:${this.config.model || "default"}`
        this.label = `genaiscript ${this.config.model || "default"}`
    }

    id() {
        return this.providerId
    }

    async callApi(prompt, context) {
        try {
            const { model, temperature, top_p, cache, version, cli, quiet } =
                this.config
            const { vars, logger } = context
            let files = vars.files // string or string[]
            if (files && !Array.isArray(files)) files = [files] // ensure array

            const args = []
            if (cli) args.push(`node`, cli)
            else
                args.push(
                    `npx`,
                    `--yes`,
                    version ? `genaiscript@${version}` : "genaiscript"
                )

            args.push("run", prompt)
            if (files) args.push(...files)
            args.push("--json")
            if (quiet) args.push("--quiet")
            if (model) args.push("--model", model)
            if (temperature !== undefined) args.push("--temperature", temperature)
            if (top_p !== undefined) args.push("--top_p", top_p)
            if (vars.vars) args.push("--vars", vars.vars)
            if (cache === false) args.push("--no-cache")

            const cmd = args
                .map((a) =>
                    typeof a === "string" && a.includes(" ") ? JSON.stringify(a) : a
                )
                .join(" ")
            logger.debug(cmd)
            const { stdout, stderr, error } = await execAsync(cmd)
            logger.debug(stderr)

            const outputText = stdout.slice(Math.max(0, stdout.indexOf("{")))
            let output
            try {
                output = JSON.parse(outputText)
            } catch (e) {
                output = {
                    text: outputText,
                    error: e,
                }
            }

            return {
                output,
                error,
            }
        } catch (e) {
            logger.error(e)
            return {
                output: { text: "" },
                error: e
            }
        }
    }
}

export default GenAIScriptApiProvider
