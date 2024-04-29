import { minimatch } from "minimatch"
import {
    PromptNode,
    appendChild,
    createAssistantNode,
    createDefNode,
    createStringTemplateNode,
    createTextNode,
    renderPromptNode,
} from "./promptdom"
import { MarkdownTrace } from "./trace"
import { DEFAULT_MODEL, DEFAULT_TEMPERATURE } from "./constants"
import {
    ChatCompletionAssistantMessageParam,
    ChatCompletionMessageParam,
    toChatCompletionUserMessage,
} from "./chat"
import { RunTemplateOptions } from "./promptcontext"
import {
    parseModelIdentifier,
    resolveLanguageModel,
    resolveModelConnectionInfo,
} from "./models"
import { renderAICI } from "./aici"
import { CancelError } from "./error"

export interface RunPromptContextNode extends RunPromptContext {
    node: PromptNode
}

export function createRunPromptContext(
    options: RunTemplateOptions,
    env: ExpansionVariables,
    trace: MarkdownTrace
): RunPromptContextNode {
    const { cancellationToken } = options || {}
    const node: PromptNode = { children: [] }

    const ctx = <RunPromptContextNode>{
        node,
        writeText: (body, options) => {
            if (body !== undefined && body !== null) {
                const { priority, maxTokens } = options || {}
                appendChild(
                    node,
                    options?.assistant
                        ? createAssistantNode(body, { priority, maxTokens })
                        : createTextNode(body, { priority, maxTokens })
                )
            }
        },
        $(strings, ...args) {
            appendChild(node, createStringTemplateNode(strings, args))
        },
        def(name, body, defOptions) {
            name = name ?? ""
            const doptions = { ...(defOptions || {}), trace }
            doptions.lineNumbers = doptions.lineNumbers ?? options.lineNumbers
            // shortcuts
            if (body === undefined || body === null) return undefined
            else if (Array.isArray(body)) {
                if (body.length === 0 && !doptions.ignoreEmpty)
                    throw new CancelError("def files empty")
                body.forEach((f) => ctx.def(name, f, defOptions))
            } else if (typeof body === "object" && body.filename) {
                const { glob, endsWith } = defOptions || {}
                const filename = body.filename
                if (glob && filename) {
                    const match = minimatch(filename, glob)
                    if (!match) return undefined
                }
                if (endsWith && !filename.endsWith(endsWith)) return undefined
                appendChild(node, createDefNode(name, body, doptions))
            } else if (typeof body === "string") {
                appendChild(
                    node,
                    createDefNode(
                        name,
                        { filename: "", content: body },
                        doptions
                    )
                )
            }

            // TODO: support clause
            return name
        },
        fence(body, options?: DefOptions) {
            ctx.def("", body, options)
            return undefined
        },
        runPrompt: async (generator, promptOptions) => {
            try {
                trace.startDetails(`🎁 run prompt`)
                if (!generator) {
                    trace.error("generator missing")
                    return <RunPromptResult>{ text: "", finishReason: "error" }
                }
                const model =
                    promptOptions?.model ?? options.model ?? DEFAULT_MODEL
                const runOptions = {
                    ...options,
                    ...(promptOptions || {}), // overrides options
                    model,
                }
                const ctx = createRunPromptContext(runOptions, env, trace)
                if (typeof generator === "string")
                    ctx.node.children.push(createTextNode(generator))
                else await generator(ctx)
                const node = ctx.node

                if (cancellationToken?.isCancellationRequested)
                    return { text: "Prompt cancelled", finishReason: "cancel" }

                const messages: ChatCompletionMessageParam[] = []
                // expand template
                const { provider } = parseModelIdentifier(model)
                if (provider === "aici") {
                    const { aici } = await renderAICI("prompt", node)
                    // todo: output processor?
                    messages.push(aici)
                } else {
                    const { prompt, assistantPrompt, images, errors } =
                        await renderPromptNode(model, node, {
                            trace,
                        })
                    trace.fence(prompt, "markdown")
                    if (images?.length || errors?.length)
                        trace.fence({ images, errors }, "yaml")
                    messages.push(toChatCompletionUserMessage(prompt, images))
                    if (assistantPrompt)
                        messages.push(<ChatCompletionAssistantMessageParam>{
                            role: "assistant",
                            content: assistantPrompt,
                        })
                }

                const connection = await resolveModelConnectionInfo({
                    model,
                })
                if (!connection.token) {
                    trace.error("model connection error", connection.info)
                    return <RunPromptResult>{ text: "", finishReason: "error" }
                }
                const { completer } = resolveLanguageModel(
                    promptOptions,
                    runOptions
                )
                const res = await completer(
                    {
                        model,
                        temperature:
                            promptOptions?.temperature ??
                            options.temperature ??
                            DEFAULT_TEMPERATURE,
                        top_p: promptOptions?.topP ?? options.topP,
                        max_tokens:
                            promptOptions?.maxTokens ?? options.maxTokens,
                        seed: promptOptions?.seed ?? options.seed,
                        stream: true,
                        messages,
                    },
                    connection.token,
                    runOptions,
                    trace
                )
                trace.details("output", res.text)
                return { text: res.text, finishReason: res.finishReason }
            } finally {
                trace.endDetails()
            }
        },
    }

    return ctx
}
