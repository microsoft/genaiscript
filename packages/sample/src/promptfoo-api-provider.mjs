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
        const { vars } = context
        const { script, spec } = vars
        console.log(context)
        const command = "node"
        const args = [
            "../cli/built/genaiscript.cjs",
            "run",
            script,
            spec,
        ]
        const { stdout, stderr, exitCode, failed } = await execa(
            command,
            args,
            {
                cleanup: true,
                preferLocal: true,
                stripFinalNewline: true,
            }
        )
        console.error(stderr)
        const output = stdout
        const error = failed ? `exit code ${exitCode}` : undefined

        return {
            output,
            error
        }
    }
}

export default GenAIScriptApiProvider
