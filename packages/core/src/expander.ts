import { Project, PromptScript } from "./ast"
import { assert, normalizeFloat, normalizeInt } from "./util"
import { MarkdownTrace } from "./trace"
import { errorMessage, isCancelError, NotSupportedError } from "./error"
import {
    JS_REGEX,
    MAX_TOOL_CALLS,
    MODEL_PROVIDER_AICI,
    PROMPTY_REGEX,
} from "./constants"
import { PromptImage, renderPromptNode } from "./promptdom"
import { createPromptContext } from "./promptcontext"
import { evalPrompt } from "./evalprompt"
import { renderAICI } from "./aici"
import {
    addToolDefinitionsMessage,
    appendSystemMessage,
    toChatCompletionUserMessage,
} from "./chat"
import { importPrompt } from "./importprompt"
import { parseModelIdentifier } from "./models"
import { JSONSchemaStringifyToTypeScript, toStrictJSONSchema } from "./schema"
import { host } from "./host"
import { resolveSystems } from "./systems"
import { GenerationOptions, GenerationStatus } from "./generation"
import { AICIRequest, ChatCompletionMessageParam } from "./chattypes"
import { promptParametersSchemaToJSONSchema } from "./parameters"

export async function callExpander(
    prj: Project,
    r: PromptScript,
    vars: ExpansionVariables,
    trace: MarkdownTrace,
    options: GenerationOptions
) {
    assert(!!options.model)
    const { provider, model } = parseModelIdentifier(r.model ?? options.model)
    const ctx = await createPromptContext(prj, vars, trace, options, model)

    let status: GenerationStatus = undefined
    let statusText: string = undefined
    let logs = ""
    let messages: ChatCompletionMessageParam[] = []
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
        if (
            r.filename &&
            !JS_REGEX.test(r.filename) &&
            !PROMPTY_REGEX.test(r.filename)
        )
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
                messages: msgs,
                images: imgs,
                errors,
                schemas: schs,
                functions: fns,
                fileMerges: fms,
                outputProcessors: ops,
                chatParticipants: cps,
                fileOutputs: fos,
            } = await renderPromptNode(model, node, {
                flexTokens: options.flexTokens,
                trace,
            })
            messages = msgs
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

    return Object.freeze({
        logs,
        status,
        statusText,
        messages,
        images,
        schemas,
        functions: Object.freeze(functions),
        fileMerges,
        outputProcessors,
        chatParticipants,
        fileOutputs,
        aici,
    })
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
    // update options
    const lineNumbers =
        options.lineNumbers ??
        template.lineNumbers ??
        resolveSystems(prj, template, undefined, options)
            .map((s) => prj.getTemplate(s))
            .some((t) => t?.lineNumbers)
    const temperature =
        options.temperature ??
        normalizeFloat(env.vars["temperature"]) ??
        template.temperature ??
        host.defaultModelOptions.temperature
    const topP =
        options.topP ?? normalizeFloat(env.vars["top_p"]) ?? template.topP
    const maxTokens =
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
    const flexTokens =
        options.flexTokens ??
        normalizeInt(env.vars["flexTokens"]) ??
        normalizeInt(env.vars["flex_tokens"]) ??
        template.flexTokens
    let seed = options.seed ?? normalizeInt(env.vars["seed"]) ?? template.seed
    if (seed !== undefined) seed = seed >> 0
    let logprobs = options.logprobs || template.logprobs

    trace.startDetails("💾 script")

    traceEnv(model, trace, env)

    trace.startDetails("🧬 prompt")
    trace.detailsFenced("📓 script source", template.jsSource, "js")

    const prompt = await callExpander(prj, template, env, trace, {
        ...options,
        maxTokens,
        maxToolCalls,
        flexTokens,
        seed,
        topP,
        temperature,
        lineNumbers,
    })

    const { status, statusText, messages } = prompt
    const images = prompt.images.slice(0)
    const schemas = structuredClone(prompt.schemas)
    const tools = prompt.functions.slice(0)
    const fileMerges = prompt.fileMerges.slice(0)
    const outputProcessors = prompt.outputProcessors.slice(0)
    const chatParticipants = prompt.chatParticipants.slice(0)
    const fileOutputs = prompt.fileOutputs.slice(0)

    if (prompt.logs?.length) trace.details("📝 console.log", prompt.logs)
    if (prompt.aici) trace.fence(prompt.aici, "yaml")
    trace.endDetails()

    if (cancellationToken?.isCancellationRequested || status === "cancelled")
        return {
            status: "cancelled",
            statusText: "user cancelled",
            messages,
        }

    if (status !== "success" || prompt.messages.length === 0)
        // cancelled
        return {
            status,
            statusText,
            messages,
        }

    if (prompt.images?.length)
        messages.push(toChatCompletionUserMessage("", prompt.images))
    if (prompt.aici) messages.push(prompt.aici)

    const addSystemMessage = (content: string) => {
        appendSystemMessage(messages, content)
        trace.fence(content, "markdown")
    }

    const systems = resolveSystems(prj, template, tools, options)
    if (systems.length)
        try {
            trace.startDetails("👾 systems")
            for (let i = 0; i < systems.length; ++i) {
                if (cancellationToken?.isCancellationRequested)
                    return {
                        status: "cancelled",
                        statusText: "user cancelled",
                        messages,
                    }

                const system = prj.getTemplate(systems[i])
                if (!system)
                    throw new Error(`system template ${systems[i]} not found`)

                trace.startDetails(`👾 ${system.id}`)
                const sysr = await callExpander(
                    prj,
                    system,
                    env,
                    trace,
                    options
                )

                if (sysr.images) images.push(...sysr.images)
                if (sysr.schemas) Object.assign(schemas, sysr.schemas)
                if (sysr.functions) tools.push(...sysr.functions)
                if (sysr.fileMerges) fileMerges.push(...sysr.fileMerges)
                if (sysr.outputProcessors)
                    outputProcessors.push(...sysr.outputProcessors)
                if (sysr.chatParticipants)
                    chatParticipants.push(...sysr.chatParticipants)
                if (sysr.fileOutputs) fileOutputs.push(...sysr.fileOutputs)
                if (sysr.logs?.length)
                    trace.details("📝 console.log", sysr.logs)
                for (const smsg of sysr.messages) {
                    if (
                        smsg.role === "user" &&
                        typeof smsg.content === "string"
                    ) {
                        addSystemMessage(smsg.content)
                    } else
                        throw new NotSupportedError(
                            "only string user messages supported in system"
                        )
                }
                if (sysr.aici) {
                    trace.fence(sysr.aici, "yaml")
                    messages.push(sysr.aici)
                }
                logprobs = logprobs || system.logprobs
                trace.detailsFenced("js", system.jsSource, "js")
                trace.endDetails()

                if (sysr.status !== "success")
                    return {
                        status: sysr.status,
                        statusText: sysr.statusText,
                        messages,
                    }
            }
        } finally {
            trace.endDetails()
        }

    if (systems.includes("system.tool_calls")) {
        addToolDefinitionsMessage(messages, tools)
        options.fallbackTools = true
    }

    const responseSchema = promptParametersSchemaToJSONSchema(
        template.responseSchema
    ) as JSONSchemaObject
    if (responseSchema)
        trace.detailsFenced("📜 response schema", responseSchema)
    let responseType = template.responseType
    if (responseSchema && responseType !== "json_schema") {
        responseType = "json_object"
        const typeName = "Output"
        const schemaTs = JSONSchemaStringifyToTypeScript(responseSchema, {
            typeName,
        })
        addSystemMessage(`You are a service that translates user requests 
into JSON objects of type "${typeName}" 
according to the following TypeScript definitions:
\`\`\`ts
${schemaTs}
\`\`\``)
    } else if (responseType === "json_object") {
        addSystemMessage("Answer using JSON.")
    } else if (responseType === "json_schema") {
        if (!responseSchema)
            throw new Error(`responseSchema is required for json_schema`)
        // try conversion
        toStrictJSONSchema(responseSchema)
    }
    trace.endDetails()

    return {
        messages,
        images,
        schemas,
        tools,
        status: <GenerationStatus>status,
        statusText: statusText,
        model,
        temperature,
        topP,
        maxTokens,
        maxToolCalls,
        seed,
        responseType,
        responseSchema,
        fileMerges,
        outputProcessors,
        chatParticipants,
        fileOutputs,
        logprobs,
    }
}
