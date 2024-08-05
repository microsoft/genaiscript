import { Project, PromptScript } from "./ast"
import { assert, normalizeFloat, normalizeInt, unique } from "./util"
import { MarkdownTrace } from "./trace"
import { errorMessage, isCancelError } from "./error"
import {
    JS_REGEX,
    MAX_TOOL_CALLS,
    MODEL_PROVIDER_AICI,
    SYSTEM_FENCE,
} from "./constants"
import { PromptImage, renderPromptNode } from "./promptdom"
import { createPromptContext } from "./promptcontext"
import { evalPrompt } from "./evalprompt"
import { renderAICI } from "./aici"
import { toChatCompletionUserMessage } from "./chat"
import { importPrompt } from "./importprompt"
import { parseModelIdentifier } from "./models"
import { JSONSchemaStringifyToTypeScript } from "./schema"
import { host, runtimeHost } from "./host"
import { resolveSystems } from "./systems"
import { GenerationOptions, GenerationStatus } from "./generation"
import {
    AICIRequest,
    ChatCompletionAssistantMessageParam,
    ChatCompletionMessageParam,
    ChatCompletionSystemMessageParam,
} from "./chattypes"

async function callExpander(
    r: PromptScript,
    vars: ExpansionVariables,
    trace: MarkdownTrace,
    options: GenerationOptions
) {
    assert(!!options.model)
    const { provider, model } = parseModelIdentifier(r.model ?? options.model)
    const ctx = await createPromptContext(vars, trace, options, model)

    let status: GenerationStatus = undefined
    let statusText: string = undefined
    let logs = ""
    let text = ""
    let assistantText = ""
    let images: PromptImage[] = []
    let schemas: Record<string, JSONSchema> = {}
    let functions: ToolCallback[] = []
    let fileMerges: FileMergeHandler[] = []
    let outputProcessors: PromptOutputProcessorHandler[] = []
    let chatParticipants: ChatParticipant[] = []
    let fileOutputs: FileOutput[] = []
    let aici: AICIRequest

    const logCb = (msg: any) => {
        logs += msg + "\n"
    }

    try {
        if (r.filename && !JS_REGEX.test(r.filename))
            await importPrompt(ctx, r, { logCb, trace })
        else {
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
                chatParticipants: cps,
                fileOutputs: fos,
            } = await renderPromptNode(model, node, { trace })
            text = prompt
            assistantText = assistantPrompt
            images = imgs
            schemas = schs
            functions = fns
            fileMerges = fms
            outputProcessors = ops
            chatParticipants = cps
            fileOutputs = fos
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
        chatParticipants,
        fileOutputs,
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

export async function expandTemplate(
    prj: Project,
    template: PromptScript,
    options: GenerationOptions,
    env: ExpansionVariables,
    trace: MarkdownTrace
) {
    const model = options.model
    assert(!!model)
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
        runtimeHost.defaultModelOptions.temperature
    const topP =
        options.topP ?? normalizeFloat(env.vars["top_p"]) ?? template.topP
    const max_tokens =
        options.maxTokens ??
        normalizeInt(env.vars["maxTokens"]) ??
        normalizeInt(env.vars["max_tokens"]) ??
        template.maxTokens
    const maxToolCalls =
        options.maxToolCalls ??
        normalizeInt(env.vars["maxToolCalls"]) ??
        normalizeInt(env.vars["max_tool_calls"]) ??
        template.maxToolCalls ??
        MAX_TOOL_CALLS
    let seed = options.seed ?? normalizeInt(env.vars["seed"]) ?? template.seed
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

    const images = prompt.images
    const schemas = prompt.schemas
    const functions = prompt.functions
    const fileMerges = prompt.fileMerges
    const outputProcessors = prompt.outputProcessors
    const chatParticipants = prompt.chatParticipants
    const fileOutputs = prompt.fileOutputs

    if (prompt.logs?.length) trace.details("📝 console.log", prompt.logs)
    if (prompt.text) trace.detailsFenced(`📝 prompt`, prompt.text, "markdown")
    if (prompt.aici) trace.fence(prompt.aici, "yaml")
    trace.endDetails()

    if (prompt.status !== "success")
        // cancelled
        return { status: prompt.status, statusText: prompt.statusText }

    if (cancellationToken?.isCancellationRequested)
        return { status: "cancelled", statusText: "user cancelled" }

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
        let system = prj.getTemplate(systemTemplate)
        if (!system) {
            if (systemTemplate) trace.error(`\`${systemTemplate}\` not found\n`)
            if (i > 0) continue
            systemTemplate = "system"
            system = prj.getTemplate(systemTemplate)
            assert(!!system)
        }

        trace.startDetails(`👾 ${systemTemplate}`)

        const sysr = await callExpander(system, env, trace, options)

        if (sysr.images) images.push(...sysr.images)
        if (sysr.schemas) Object.assign(schemas, sysr.schemas)
        if (sysr.functions) functions.push(...sysr.functions)
        if (sysr.fileMerges) fileMerges.push(...sysr.fileMerges)
        if (sysr.outputProcessors)
            outputProcessors.push(...sysr.outputProcessors)
        if (sysr.chatParticipants)
            chatParticipants.push(...sysr.chatParticipants)
        if (sysr.fileOutputs) fileOutputs.push(...sysr.fileOutputs)
        if (sysr.logs?.length) trace.details("📝 console.log", sysr.logs)
        if (sysr.text) {
            systemMessage.content += SYSTEM_FENCE + "\n" + sysr.text + "\n"
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

    const responseSchema: JSONSchema = template.responseSchema
    let responseType = template.responseType
    if (responseSchema) {
        responseType = "json_object"
        const typeName = "Output"
        const schemaTs = JSONSchemaStringifyToTypeScript(responseSchema, {
            typeName,
        })
        messages.unshift({
            role: "system",
            content: `You are a service that translates user requests 
into JSON objects of type "${typeName}" 
according to the following TypeScript definitions:
\`\`\`ts
${schemaTs}
\`\`\``,
        })
    } else if (responseType === "json_object") {
        messages.unshift({
            role: "system",
            content: `Answer using JSON.`,
        })
    }
    if (systemMessage.content) messages.unshift(systemMessage)

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
        chatParticipants,
        fileOutputs,
    }
}
