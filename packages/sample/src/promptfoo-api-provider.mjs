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
        const { model, temperature, topK, cache } = this.config
        const { vars } = context
        const { files } = vars

        const command = "node"
        const args = ["../cli/built/genaiscript.cjs", "run", prompt, files]
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
        const output = stdout?.replace("Warning: TT: undefined function: 32", "")
        const error = failed ? `exit code ${exitCode}` : undefined
        return {
            output,
            error,
        }
    }
}

export default GenAIScriptApiProvider
