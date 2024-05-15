import { Fragment, Project, PromptScript } from "./ast"
import { assert, normalizeFloat, normalizeInt, normalizeString } from "./util"
import { MarkdownTrace } from "./trace"
import { errorMessage, isCancelError } from "./error"
import { estimateTokens } from "./tokens"
import {
    DEFAULT_MODEL,
    DEFAULT_TEMPERATURE,
    MAX_TOOL_CALLS,
    MODEL_PROVIDER_AICI,
    SYSTEM_FENCE,
} from "./constants"
import { PromptImage, renderPromptNode } from "./promptdom"
import { GenerationOptions, createPromptContext } from "./promptcontext"
import { evalPrompt } from "./evalprompt"
import { AICIRequest, renderAICI } from "./aici"
import {
    ChatCompletionAssistantMessageParam,
    ChatCompletionMessageParam,
    ChatCompletionSystemMessageParam,
    toChatCompletionUserMessage,
} from "./chat"
import { importPrompt } from "./importprompt"
import { lookupMime } from "./mime"
import { parseModelIdentifier } from "./models"
import { stringifySchemaToTypeScript } from "./schema"

const defaultTopP: number = undefined
const defaultSeed: number = undefined
const defaultMaxTokens: number = undefined

export interface GenerationResult extends GenerationOutput {
    /**
     * The env variables sent to the prompt
     */
    vars: Partial<ExpansionVariables>

    /**
     * Expanded prompt text
     */
    messages: ChatCompletionMessageParam[]

    /**
     * Zero or more edits to apply.
     */
    edits: Edits[]

    /**
     * Parsed source annotations
     */
    annotations: Diagnostic[]

    /**
     * ChangeLog sections
     */
    changelogs: string[]

    /**
     * MD-formatted trace.
     */
    trace: string

    /**
     * Error message if any
     */
    error?: unknown

    /**
     * Run status
     */
    status: GenerationStatus

    /**
     * Status message if any
     */
    statusText?: string

    /**
     * Run label if provided
     */
    label?: string

    /**
     * GenAIScript version
     */
    version: string
}

export interface GenerationStats {
    toolCalls: number
    repairs: number
}

export type GenerationStatus = "success" | "error" | "cancelled" | undefined

async function callExpander(
    r: PromptScript,
    vars: ExpansionVariables,
    trace: MarkdownTrace,
    options: GenerationOptions
) {
    const { provider, model } = parseModelIdentifier(r.model)
    const ctx = createPromptContext(vars, trace, options, model)

    let status: GenerationStatus = undefined
    let statusText: string = undefined
    let logs = ""
    let text = ""
    let assistantText = ""
    let images: PromptImage[] = []
    let schemas: Record<string, JSONSchema> = {}
    let functions: ChatFunctionCallback[] = []
    let fileMerges: FileMergeHandler[] = []
    let outputProcessors: PromptOutputProcessorHandler[] = []
    let aici: AICIRequest

    const logCb = (msg: any) => {
        logs += msg + "\n"
    }

    try {
        if (/^export\s+default\s+/m.test(r.jsSource)) {
            if (!/\.mjs$/i.test(r.filename))
                throw new Error("export default requires .mjs file")
            await importPrompt(ctx, r, { logCb })
        } else {
            await evalPrompt(ctx, r, {
                sourceMaps: true,
                logCb,
            })
        }
        const node = ctx.node
        if (provider !== MODEL_PROVIDER_AICI) {
            const {
                prompt,
                assistantPrompt,
                images: imgs,
                errors,
                schemas: schs,
                functions: fns,
                fileMerges: fms,
                outputProcessors: ops,
            } = await renderPromptNode(model, node, { trace })
            text = prompt
            assistantText = assistantPrompt
            images = imgs
            schemas = schs
            functions = fns
            fileMerges = fms
            outputProcessors = ops
            if (errors?.length) {
                for (const error of errors) trace.error(``, error)
                status = "error"
                statusText = errors.map((e) => errorMessage(e)).join("\n")
            } else {
                status = "success"
            }
        } else {
            const tmp = await renderAICI(r.id.replace(/[^a-z0-9_]/gi, ""), node)
            outputProcessors = tmp.outputProcessors
            aici = tmp.aici
            status = "success"
        }
    } catch (e) {
        status = "error"
        statusText = errorMessage(e)
        if (isCancelError(e)) {
            status = "cancelled"
            trace.note(statusText)
        } else {
            trace.error(undefined, e)
        }
    }

    return {
        logs,
        status,
        statusText,
        text,
        assistantText,
        images,
        schemas,
        functions,
        fileMerges,
        outputProcessors,
        aici,
    }
}

function traceEnv(
    model: string,
    trace: MarkdownTrace,
    env: ExpansionVariables
) {
    trace.startDetails("🏡 env")
    trace.files(env.files, {
        title: "💾 files",
        model,
        skipIfEmpty: true,
        secrets: env.secrets,
    })
    const vars = Object.entries(env.vars || {})
    if (vars.length) {
        trace.startDetails("🧮 vars")
        for (const [k, v] of vars) {
            trace.itemValue(k, v)
        }
        trace.endDetails()
    }
    const secrets = Object.keys(env.secrets || {})
    if (secrets.length) {
        trace.itemValue(`🔐 secrets`, secrets.join(", "))
    }
    trace.endDetails()
}

function resolveTool(prj: Project, tool: string) {
    const system = prj.templates.find(
        (t) => t.isSystem && t.jsSource.includes(`defTool("${tool}"`)
    )
    return system.id
}

export function resolveSystems(prj: Project, template: PromptScript) {
    const { jsSource } = template
    const systems = Array.from(
        new Set([
            ...(template.system ?? []),
            ...(template.tools ?? []).map((tool) => resolveTool(prj, tool)),
        ])
    ).filter((s) => s)

    if (template.system === undefined) {
        const useSchema = /defschema/i.test(jsSource)
        systems.push("system")
        systems.push("system.explanations")
        // select file expansion type
        if (/diff/i.test(jsSource)) systems.push("system.diff")
        else if (/changelog/i.test(jsSource)) systems.push("system.changelog")
        else {
            systems.push("system.files")
            if (useSchema) systems.push("system.files_schema")
        }
        if (useSchema) systems.push("system.schema")
        if (/annotations?/i.test(jsSource)) systems.push("system.annotations")
    }
    return systems
}

export async function expandTemplate(
    prj: Project,
    template: PromptScript,
    fragment: Fragment,
    options: GenerationOptions,
    env: ExpansionVariables,
    trace: MarkdownTrace
) {
    const model = options.model
    assert(model !== undefined)
    const cancellationToken = options.cancellationToken
    const systems = resolveSystems(prj, template)
    const systemTemplates = systems.map((s) => prj.getTemplate(s))
    // update options
    options.lineNumbers =
        options.lineNumbers ??
        template.lineNumbers ??
        systemTemplates.some((s) => s?.lineNumbers)
    const temperature =
        options.temperature ??
        normalizeFloat(env.vars["temperature"]) ??
        template.temperature ??
        DEFAULT_TEMPERATURE
    const topP =
        options.topP ??
        normalizeFloat(env.vars["top_p"]) ??
        template.topP ??
        defaultTopP
    const max_tokens =
        options.maxTokens ??
        normalizeInt(env.vars["maxTokens"]) ??
        template.maxTokens ??
        defaultMaxTokens
    const maxToolCalls =
        options.maxToolCalls ??
        normalizeInt(env.vars["maxToolCalls"]) ??
        template.maxToolCalls ??
        MAX_TOOL_CALLS
    let seed =
        options.seed ??
        normalizeInt(env.vars["seed"]) ??
        template.seed ??
        defaultSeed
    if (seed !== undefined) seed = seed >> 0

    trace.startDetails("💾 script")

    trace.itemValue(`temperature`, temperature)
    trace.itemValue(`top_p`, topP)
    trace.itemValue(`max tokens`, max_tokens)
    trace.itemValue(`seed`, seed)

    traceEnv(model, trace, env)

    trace.startDetails("🧬 prompt")
    trace.detailsFenced("📓 script source", template.jsSource, "js")

    const prompt = await callExpander(template, env, trace, options)

    const expanded = prompt.text
    const images = prompt.images
    const schemas = prompt.schemas
    const functions = prompt.functions
    const fileMerges = prompt.fileMerges
    const outputProcessors = prompt.outputProcessors

    if (prompt.logs?.length) trace.details("📝 console.log", prompt.logs)
    if (prompt.text) {
        trace.itemValue(`tokens`, estimateTokens(model, expanded))
        trace.fence(prompt.text, "markdown")
    }
    if (prompt.aici) trace.fence(prompt.aici, "yaml")
    trace.endDetails()

    if (prompt.status !== "success")
        // cancelled
        return { status: prompt.status, statusText: prompt.statusText }

    if (cancellationToken?.isCancellationRequested)
        return { status: "cancelled", statusText: "user cancelled" }

    let responseSchema: JSONSchema = template.responseSchema
    let responseType = template.responseType
    const systemMessage: ChatCompletionSystemMessageParam = {
        role: "system",
        content: "",
    }
    const messages: ChatCompletionMessageParam[] = []
    if (prompt.text)
        messages.push(toChatCompletionUserMessage(prompt.text, prompt.images))
    if (prompt.aici) messages.push(prompt.aici)

    for (let i = 0; i < systems.length; ++i) {
        if (cancellationToken?.isCancellationRequested)
            return { status: "cancelled", statusText: "user cancelled" }

        let systemTemplate = systems[i]
        let system = fragment.file.project.getTemplate(systemTemplate)
        if (!system) {
            if (systemTemplate) trace.error(`\`${systemTemplate}\` not found\n`)
            if (i > 0) continue
            systemTemplate = "system"
            system = fragment.file.project.getTemplate(systemTemplate)
            assert(!!system)
        }

        trace.startDetails(`👾 ${systemTemplate}`)

        const sysr = await callExpander(system, env, trace, options)
        responseType = responseType ?? system.responseType
        responseSchema = responseSchema ?? system.responseSchema

        if (sysr.images) images.push(...sysr.images)
        if (sysr.schemas) Object.assign(schemas, sysr.schemas)
        if (sysr.functions) functions.push(...sysr.functions)
        if (sysr.fileMerges) fileMerges.push(...sysr.fileMerges)
        if (sysr.outputProcessors) outputProcessors.push(...outputProcessors)
        if (sysr.logs?.length) trace.details("📝 console.log", sysr.logs)
        if (sysr.text) {
            systemMessage.content += SYSTEM_FENCE + "\n" + sysr.text + "\n"
            trace.item(
                `tokens: ${estimateTokens(model || template.model || DEFAULT_MODEL, sysr.text)}`
            )
            trace.fence(sysr.text, "markdown")
        }
        if (sysr.aici) {
            trace.fence(sysr.aici, "yaml")
            messages.push(sysr.aici)
        }

        trace.detailsFenced("js", system.jsSource, "js")
        trace.endDetails()

        if (sysr.status !== "success")
            return { status: sysr.status, statusText: sysr.statusText }
    }

    if (systemMessage.content) messages.unshift(systemMessage)

    if (responseSchema) {
        responseType = "json_object"
        const typeName = "Output"
        const schemaTs = stringifySchemaToTypeScript(responseSchema, {
            typeName,
        })
        trace.detailsFenced("📦 response schema", schemaTs, "ts")
        messages.push({
            role: "system",
            content: `You are a service that translates user requests 
into JSON objects of type "${typeName}" 
according to the following TypeScript definitions:
\`\`\`ts
${schemaTs}
\`\`\``,
        })
    }

    if (prompt.assistantText) {
        trace.detailsFenced("🤖 assistant", prompt.assistantText, "markdown")
        const assistantMessage: ChatCompletionAssistantMessageParam = {
            role: "assistant",
            content: prompt.assistantText,
        }
        messages.push(assistantMessage)
    }

    trace.endDetails()

    return {
        messages,
        images,
        schemas,
        functions,
        status: <GenerationStatus>prompt.status,
        statusText: prompt.statusText,
        model,
        temperature,
        topP,
        max_tokens,
        maxToolCalls,
        seed,
        responseType,
        responseSchema,
        fileMerges,
        outputProcessors,
    }
}
