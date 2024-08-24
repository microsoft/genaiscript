/**
 * GenAiScript PromptFoo Custom Provider
 *
 * Do not edit, auto-generated.
 *
 */
import { promisify } from "node:util"
import { exec } from "node:child_process"

const execAsync = promisify(exec)

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
        const { model, temperature, top_p, cache, version, cli, quiet } =
            this.config
        const { vars, logger } = context
        try {
            let files = vars.files // string or string[]
            const testVars = vars.vars // {}
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
            args.push("--run-retry", 2)
            if (testVars && typeof testVars === "object") {
                args.push("--vars")
                for (const [key, value] of Object.entries(testVars)) {
                    args.push(`${key}=${JSON.stringify(value)}`)
                }
            }
            args.push("--json")
            if (quiet) args.push("--quiet")
            if (model) args.push("--model", model)
            if (temperature !== undefined)
                args.push("--temperature", temperature)
            if (top_p !== undefined) args.push("--top_p", top_p)
            if (cache === false) args.push("--no-cache")

            const cmd = args
                .map((a) =>
                    typeof a === "string" && a.includes(" ")
                        ? JSON.stringify(a)
                        : a
                )
                .join(" ")
            logger.info(cmd)
            let { stdout, stderr, error } = await execAsync(cmd)
            logger.debug(stderr)

            const outputText = stdout.slice(Math.max(0, stdout.indexOf("{")))
            let output
            try {
                output = JSON.parse(outputText)
                if (output.status === "error")
                    error = output.statusText || error || "error"
            } catch (e) {
                error = e?.message || "error parsing genaiscript json output"
                output = {
                    text: outputText,
                    error,
                }
            }

            if (error) logger.error(error)
            return {
                output,
                error,
            }
        } catch (e) {
            logger.error(e)
            return {
                output: { text: "" },
                error: e,
            }
        }
    }
}

export default GenAIScriptApiProvider
