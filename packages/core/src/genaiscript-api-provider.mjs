import { pathToFileURL } from "node:url"

function deleteUndefinedValues(o) {
    if (typeof o === "object" && !Array.isArray(o))
        for (const k in o) if (o[k] === undefined) delete o[k]
    return o
}

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
            options.runTrace = false
            options.lobprobs = true

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
            //logger.debug(res)
            const { error, stats, logprobs, finishReason } = res || {}
            const cost = stats?.cost
            const logProbs = logprobs?.length
                ? logprobs.map((lp) => lp.logprob)
                : undefined
            const isRefusal =
                finishReason === "refusal" || finishReason === "content_filter"

            /*
                https://www.promptfoo.dev/docs/configuration/reference/#providerresponse
            */
            const pres = deleteUndefinedValues({
                error,
                cost,
                tokenUsage: stats
                    ? deleteUndefinedValues({
                          total: stats.total_tokens,
                          prompt: stats.prompt_tokens,
                          completion: stats.completion_tokens,
                          cached: stats.prompt_tokens_details?.cached_tokens,
                      })
                    : undefined,
                logProbs,
                isRefusal,
                output: res,
            })
            return pres
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
