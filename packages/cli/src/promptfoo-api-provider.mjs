import { execa } from "execa"

// https://promptfoo.dev/docs/providers/custom-api
class GenAIScriptApiProvider {
    constructor(options) {
        this.config = options.config
        this.providerId =
            options.id || `genaiscript:${this.config.model || "default"}`
    }

    id() {
        return this.providerId
    }

    async callApi(prompt, context) {
        const { model, temperature, topK, cache, version } = this.config
        const { vars } = context
        const { files } = vars

        const package = version ? `genaiscript@${version}` : "genaiscript"
        const command = "npx"
        const args = ["--yes", package, "run", prompt]
        if (files) args.push(files)
        if (model) args.push("--model", model)
        if (temperature !== undefined) args.push("--temperature", temperature)
        if (topK !== undefined) args.push("--top_k", topK)
        if (vars.vars) args.push("--vars", vars.vars)
        if (cache === false) args.push("--no-cache")

        const { stdout, exitCode, failed } = await execa(command, args, {
            cleanup: true,
            preferLocal: true,
            stripFinalNewline: true,
        })
        const output = stdout?.replace(
            "Warning: TT: undefined function: 32",
            ""
        )
        const error = failed ? `exit code ${exitCode}` : undefined

        return {
            output,
            error,
        }
    }
}

export default GenAIScriptApiProvider
