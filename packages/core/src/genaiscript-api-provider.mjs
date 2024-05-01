import { spawn } from "node:child_process"

// https://promptfoo.dev/docs/providers/custom-api
class GenAIScriptApiProvider {
    constructor(options) {
        this.config = options.config
        this.providerId =
            options.id || `genaiscript:${this.config.model || "default"}`
        this.label = `genaiscript ${this.config.model || "default model"}`
    }

    id() {
        return this.providerId
    }

    callApi(prompt, context) {
        return new Promise((resolve, reject) => {
            try {
                const {
                    model,
                    temperature,
                    top_p,
                    cache,
                    version,
                    cli,
                    quiet,
                } = this.config
                const { vars } = context
                let files = vars.files // string or string[]
                if (files && !Array.isArray(files)) files = [files] // ensure array

                let cmd = ""
                const args = []
                if (cli) {
                    cmd = "node"
                    args.push(cli)
                } else {
                    cmd = "npx"
                    args.push(
                        `--yes`,
                        version ? `genaiscript@${version}` : "genaiscript"
                    )
                }

                args.push("run", prompt)
                if (files) args.push(...files)
                args.push("--json")
                if (quiet) args.push("--quiet")
                if (model) args.push("--model", model)
                if (temperature !== undefined)
                    args.push("--temperature", temperature)
                if (top_p !== undefined) args.push("--top_p", top_p)
                if (vars.vars) args.push("--vars", vars.vars)
                if (cache === false) args.push("--no-cache")

                console.debug(
                    `${cmd} ${args
                        .map((a) =>
                            typeof a === "string" && a.includes(" ")
                                ? JSON.stringify(a)
                                : a
                        )
                        .join(" ")}`
                )
                let stdout = ""
                const child = spawn(cmd, {
                    args,
                    stdio: ["pipe", "pipe", "inherit"],
                })
                child.stdout.on("data", (data) => {
                    stdout += data
                })
                child.on("error", (e) => reject(e))
                child.on("close", (exitCode) => {
                    let output
                    try {
                        console.debug(`exit code: ${exitCode}`)
                        const outputText = stdout.slice(
                            Math.max(0, stdout.indexOf("{"))
                        )
                        output = JSON.parse(outputText)
                    } catch (e) {
                        output = {
                            text: stdout,
                            error: e,
                        }
                    }
                    resolve({
                        output,
                    })
                })
            } catch (e) {
                reject(e)
            }
        })
    }
}

export default GenAIScriptApiProvider
