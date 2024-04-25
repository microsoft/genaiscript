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
        const { model, temperature } = this.config
        const { vars } = context
        const { spec } = vars

//        console.log({ prompt, context, config: this.config })

        const command = "node"
        const args = ["../cli/built/genaiscript.cjs", "run", prompt, spec]
        if (model) args.push("--model", model)
        if (temperature !== undefined) args.push("--temperature", temperature)

        // console.log(args.join(" "))
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
