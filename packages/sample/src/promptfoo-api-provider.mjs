import { execa } from "execa"

class GenAIScriptApiProvider {
    constructor(options) {
        this.providerId = options.id || "genaiscript"
        this.config = options.config
    }

    id() {
        return this.providerId
    }

    async callApi(prompt, context) {
        const { model, temperature, topK } = this.config
        const { vars } = context
        const { files } = vars

        const command = "node"
        const args = ["../cli/built/genaiscript.cjs", "run", prompt, files, "--no-cache"]
        if (model) args.push("--model", model)
        if (temperature !== undefined) args.push("--temperature", temperature)
        if (topK !== undefined) args.push("--top_k", topK)
        if (vars.vars) args.push("--vars", vars.vars)
        const { stdout, exitCode, failed } = await execa(command, args, {
            cleanup: true,
            preferLocal: true,
            stripFinalNewline: true,
        })
        const output = stdout
        const error = failed ? `exit code ${exitCode}` : undefined
        return {
            output,
            error,
        }
    }
}

export default GenAIScriptApiProvider
