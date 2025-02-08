import { pathToFileURL } from "node:url"

/**
 * GenAiScript PromptFoo Custom Provider
 *
 * Do not edit, auto-generated.
 *
 */
class GenAIScriptApiProvider {
    constructor(options) {
        this.config = options.config
        this.providerId =
            options.id ||
            `genaiscript/${this.config.model || "large"}/${this.config.smallModel || "small"}/${this.config.visionModel || "vision"}`
        this.label = `genaiscript ${this.config.model || "large"}, ${this.config.smallModel || "small"}, ${this.config.visionModel || "vision"}`
    }

    id() {
        return this.providerId
    }

    async callApi(scriptId, context) {
        const { logger } = context
        try {
            const files = context.vars.files // string or string[]
            const workspaceFiles = context.vars.workspaceFiles // WorkspaceFile or WorkspaceFile[]

            let { cli, ...options } = structuredClone(this.config)
            options.runTries = 2

            const testVars = context.vars.vars // {}
            if (testVars && typeof testVars === "object")
                options.vars = { ...(this.config.vars || []), ...testVars }
            if (process.platform === "win32" && !cli.startsWith("file://"))
                cli = pathToFileURL(cli).href
            if (workspaceFiles)
                options.workspaceFiles = Array.isArray(workspaceFiles)
                    ? workspaceFiles
                    : [workspaceFiles]
            const api = await import(cli ?? "genaiscript/api")
            const res = await api.run(scriptId, files, options)
            logger.debug(res)
            return {
                output: res,
                error: res?.error,
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
