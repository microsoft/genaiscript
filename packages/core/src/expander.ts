import debug from "debug"
const dbg = debug("genaiscript:expander")

import { resolveScript } from "./ast"
import { assert } from "./util"
import { MarkdownTrace } from "./trace"
import { errorMessage, isCancelError, NotSupportedError } from "./error"
import { JS_REGEX, MAX_TOOL_CALLS, PROMPTY_REGEX } from "./constants"
import {
    finalizeMessages,
    PromptImage,
    PromptPrediction,
    renderPromptNode,
} from "./promptdom"
import { createPromptContext } from "./promptcontext"
import { evalPrompt } from "./evalprompt"
import { addToolDefinitionsMessage, appendSystemMessage } from "./chat"
import { importPrompt } from "./importprompt"
import { runtimeHost } from "./host"
import { addFallbackToolSystems, resolveSystems } from "./systems"
import { GenerationOptions } from "./generation"
import {
    ChatCompletionMessageParam,
    ChatCompletionReasoningEffort,
} from "./chattypes"
import { GenerationStatus, Project } from "./server/messages"
import { dispose } from "./dispose"
import { normalizeFloat, normalizeInt } from "./cleaners"
import { mergeEnvVarsWithSystem } from "./vars"
import { installGlobalPromptContext } from "./globals"
import { mark } from "./performance"
import { nodeIsPackageTypeModule } from "./nodepackage"

/**
 * Executes a prompt expansion process based on the provided prompt script, variables, and options.
 *
 * @param prj - The project instance in which the prompt script is executed.
 * @param r - The prompt script to be evaluated, containing the logic and structure of the prompt.
 * @param ev - Expansion variables to customize the prompt script evaluation.
 * @param trace - The trace object used for generating logs and debugging details.
 * @param options - Configuration options that influence the prompt expansion and evaluation.
 * @param installGlobally - Specifies whether the prompt context should be installed globally.
 * @returns An object containing the status of the operation, generated messages, images, schema definitions, tools, logs, and other related outputs.
 */
export async function callExpander(
    prj: Project,
    r: PromptScript,
    ev: ExpansionVariables,
    trace: MarkdownTrace,
    options: GenerationOptions,
    installGlobally: boolean
) {
    mark("prompt.expand.main")
    assert(!!options.model)
    const modelId = r.model ?? options.model
    const ctx = await createPromptContext(prj, ev, trace, options, modelId)
    if (installGlobally) installGlobalPromptContext(ctx)

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
    let disposables: AsyncDisposable[] = []
    let prediction: PromptPrediction

    const logCb = (msg: any) => {
        logs += msg + "\n"
    }

    // package.json { type: "module" }
    const isModule = await nodeIsPackageTypeModule()
    try {
        if (
            r.filename &&
            (isModule || !JS_REGEX.test(r.filename)) &&
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
        const {
            messages: msgs,
            images: imgs,
            errors,
            schemas: schs,
            tools: fns,
            fileMerges: fms,
            outputProcessors: ops,
            chatParticipants: cps,
            fileOutputs: fos,
            prediction: pred,
            disposables: mcps,
        } = await renderPromptNode(modelId, node, {
            flexTokens: options.flexTokens,
            fenceFormat: options.fenceFormat,
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
        disposables = mcps
        prediction = pred
        if (errors?.length) {
            for (const error of errors) trace.error(``, error)
            status = "error"
            statusText = errors.map((e) => errorMessage(e)).join("\n")
        } else {
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
        disposables,
        prediction,
    })
}

function traceEnv(
    model: string,
    trace: MarkdownTrace,
    env: Partial<ExpansionVariables>
) {
    trace.startDetails("🏡 env")
    trace.files(env.files, {
        title: "💾 files",
        model,
        skipIfEmpty: true,
        secrets: env.secrets,
        maxLength: 0,
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

/**
 * /**
 *  * Expands a template into a structured prompt to be used for generation.
 *  *
 *  * @param prj The project context for resolution of scripts and systems.
 *  * @param template The template script to be expanded.
 *  * @param options Configuration options for template expansion and generation.
 *  * @param env The environment variables and metadata for the template expansion process.
 *  * @returns An object containing the expanded prompt details, including messages, images, schemas, tools, and more.
 *  *
 *  * Parameters:
 *  * @param prj
 *  * - The current project instance, used to resolve associated systems and scripts.
 *  *
 *  * @param template
 *  * - The source template script containing configurations and definitions for prompt generation.
 *  *
 *  * @param  - has parameters/options i
 */
export async function expandTemplate(
    prj: Project,
    template: PromptScript,
    options: GenerationOptions,
    env: ExpansionVariables
) {
    mark("prompt.expand.script")
    const trace = options.trace
    const model = options.model
    assert(!!trace)
    assert(!!model)
    const cancellationToken = options.cancellationToken
    // update options
    const lineNumbers =
        options.lineNumbers ??
        template.lineNumbers ??
        resolveSystems(prj, template, undefined)
            .map((s) => resolveScript(prj, s))
            .some((t) => t?.lineNumbers)
    const temperature =
        options.temperature ??
        normalizeFloat(env.vars["temperature"]) ??
        template.temperature ??
        runtimeHost.modelAliases.large.temperature
    options.fallbackTools =
        options.fallbackTools ??
        template.fallbackTools ??
        runtimeHost.modelAliases.large.fallbackTools
    const reasoningEffort: ChatCompletionReasoningEffort =
        options.reasoningEffort ??
        env.vars["reasoning_effort"] ??
        template.reasoningEffort ??
        runtimeHost.modelAliases.large.reasoningEffort
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
    const fenceFormat = options.fenceFormat ?? template.fenceFormat
    const cache = options.cache ?? template.cache
    let seed = options.seed ?? normalizeInt(env.vars["seed"]) ?? template.seed
    if (seed !== undefined) seed = seed >> 0
    let logprobs = options.logprobs || template.logprobs
    let topLogprobs = Math.max(
        options.topLogprobs || 0,
        template.topLogprobs || 0
    )

    // finalize options
    env.meta.model = model
    Object.freeze(env.meta)

    trace.startDetails("💾 script", { expanded: true })

    traceEnv(model, trace, env)

    trace.startDetails("🧬 prompt", { expanded: true })
    trace.detailsFenced("💻 script source", template.jsSource, "js")

    const prompt = await callExpander(
        prj,
        template,
        env,
        trace,
        {
            ...options,
            maxTokens,
            maxToolCalls,
            flexTokens,
            seed,
            topP,
            temperature,
            reasoningEffort,
            lineNumbers,
            fenceFormat,
        },
        true
    )

    const { status, statusText, messages } = prompt
    const images = prompt.images.slice(0)
    const schemas = structuredClone(prompt.schemas)
    const tools = prompt.functions.slice(0)
    const fileMerges = prompt.fileMerges.slice(0)
    const outputProcessors = prompt.outputProcessors.slice(0)
    const chatParticipants = prompt.chatParticipants.slice(0)
    const fileOutputs = prompt.fileOutputs.slice(0)
    const prediction = prompt.prediction
    const disposables = prompt.disposables.slice(0)

    if (prompt.logs?.length) trace.details("📝 console.log", prompt.logs)
    trace.endDetails()

    if (cancellationToken?.isCancellationRequested || status === "cancelled") {
        await dispose(disposables, { trace })
        return {
            status: "cancelled",
            statusText: "user cancelled",
            messages,
        }
    }

    if (status !== "success" || prompt.messages.length === 0) {
        // cancelled
        await dispose(disposables, { trace })
        return {
            status,
            statusText,
            messages,
        }
    }

    const addSystemMessage = (content: string) => {
        appendSystemMessage(messages, content)
        trace.fence(content, "markdown")
    }

    const systems = resolveSystems(prj, template, tools)
    if (systems.length)
        if (messages[0].role === "system")
            // there's already a system message. add empty before
            messages.unshift({ role: "system", content: "" })

    if (addFallbackToolSystems(systems, tools, template, options)) {
        dbg("added fallback tools")
        assert(!Object.isFrozen(options))
        options.fallbackTools = true
    }

    try {
        trace.startDetails("👾 systems", { expanded: true })
        for (let i = 0; i < systems.length; ++i) {
            if (cancellationToken?.isCancellationRequested) {
                await dispose(disposables, { trace })
                return {
                    status: "cancelled",
                    statusText: "user cancelled",
                    messages,
                }
            }

            const systemId = systems[i]
            dbg(`system ${systemId.id}`)
            const system = resolveScript(prj, systemId)
            if (!system)
                throw new Error(`system template ${systemId.id} not found`)

            trace.startDetails(`👾 ${system.id}`)
            const sysr = await callExpander(
                prj,
                system,
                mergeEnvVarsWithSystem(env, systemId),
                trace,
                options,
                false
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
            if (sysr.disposables?.length) disposables.push(...sysr.disposables)
            if (sysr.logs?.length) trace.details("📝 console.log", sysr.logs)
            for (const smsg of sysr.messages) {
                if (smsg.role === "user" && typeof smsg.content === "string") {
                    addSystemMessage(smsg.content)
                } else
                    throw new NotSupportedError(
                        "only string user messages supported in system"
                    )
            }
            logprobs = logprobs || system.logprobs
            topLogprobs = Math.max(topLogprobs, system.topLogprobs || 0)
            trace.detailsFenced("💻 script source", system.jsSource, "js")
            trace.endDetails()

            if (sysr.status !== "success") {
                await dispose(disposables, options)
                return {
                    status: sysr.status,
                    statusText: sysr.statusText,
                    messages,
                }
            }
        }
    } finally {
        trace.endDetails()
    }

    if (options.fallbackTools) {
        addToolDefinitionsMessage(messages, tools)
    }

    const { responseType, responseSchema } = finalizeMessages(messages, {
        ...template,
        fileOutputs,
        trace,
    })

    trace.endDetails()

    return {
        cache,
        messages,
        images,
        schemas,
        tools,
        status: <GenerationStatus>status,
        statusText: statusText,
        model,
        temperature,
        reasoningEffort,
        topP,
        maxTokens,
        maxToolCalls,
        seed,
        responseType,
        responseSchema,
        fileMerges,
        prediction,
        outputProcessors,
        chatParticipants,
        fileOutputs,
        logprobs,
        topLogprobs,
        disposables,
        fallbackTools: options.fallbackTools,
    }
}
