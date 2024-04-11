import { minimatch } from "minimatch"
import {
    PromptNode,
    appendChild,
    createAssistantNode,
    createStringTemplateNode,
    createTextNode,
    renderPromptNode,
} from "./promptdom"
import { createDefNode } from "./filedom"
import { MarkdownTrace } from "./trace"
import { DEFAULT_MODEL, DEFAULT_TEMPERATURE } from "./constants"
import { ChatCompletionAssistantMessageParam, ChatCompletionMessageParam, toChatCompletionUserMessage } from "./chat"
import { RunTemplateOptions } from "./promptcontext"
import { resolveLanguageModel } from "./models"
import { renderAICI } from "./aici"
import { initToken } from "./oai_token"
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
    const { vars } = env
    const node: PromptNode = { children: [] }

    const ctx = <RunPromptContextNode>{
        node,
        writeText: (body, options) => {
            if (body !== undefined && body !== null)
                appendChild(
                    node,
                    options?.assistant ? createAssistantNode(body) : createTextNode(body)
                )
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
                if (body.length === 0 && !doptions.ignoreEmpty) throw new CancelError("def files empty")
                body.forEach((f) => ctx.def(name, f, defOptions))
            }
            else if (typeof body === "object" && body.filename) {
                const { glob, endsWith } = defOptions || {}
                const filename = body.filename
                if (glob && filename) {
                    const match = minimatch(filename, glob)
                    if (!match) return undefined
                }
                if (endsWith && !filename.endsWith(endsWith)) return undefined
                appendChild(node, createDefNode(name, body, env, doptions))
            } else if (typeof body === "string") {
                appendChild(
                    node,
                    createDefNode(
                        name,
                        { filename: "", label: "", content: body },
                        env,
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
                    return <RunPromptResult>{ text: "" }
                }
                const ctx = createRunPromptContext(
                    options,
                    env,
                    trace
                )
                const model =
                    promptOptions?.model ?? options.model ?? DEFAULT_MODEL
                await generator(ctx)
                const node = ctx.node

                if (cancellationToken?.isCancellationRequested)
                    return { text: "Prompt cancelled", finishReason: "cancel" }

                const messages: ChatCompletionMessageParam[] = []
                // expand template
                if (promptOptions?.aici) {
                    const { aici } = await renderAICI("prompt", node)
                    // todo: output processor?
                    messages.push(aici)
                } else {
                    const { prompt, assistantPrompt, images, errors } = await renderPromptNode(
                        model,
                        node,
                        {
                            trace,
                        }
                    )
                    trace.fence(prompt, "markdown")
                    if (images?.length || errors?.length)
                        trace.fence({ images, errors }, "yaml")
                    messages.push(toChatCompletionUserMessage(prompt, images))
                    if (assistantPrompt)
                        messages.push(<ChatCompletionAssistantMessageParam>{ role: "assistant", content: assistantPrompt })
                }

                // call LLM
                const { completer } = resolveLanguageModel(
                    promptOptions?.aici ? "aici" : "openai",
                    options
                )
                const token = await initToken({
                    model,
                    aici: promptOptions?.aici,
                })
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
                    token,
                    { ...options, trace }
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
