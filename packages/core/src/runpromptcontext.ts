import { minimatch } from "minimatch"
import {
    PromptNode,
    appendChild,
    createStringTemplateNode,
    createTextNode,
    renderPromptNode,
} from "./promptdom"
import { createDefNode } from "./filedom"
import { MarkdownTrace } from "./trace"
import { DEFAULT_MODEL, DEFAULT_TEMPERATURE } from "./constants"
import { toChatCompletionUserMessage } from "./chat"
import { RunTemplateOptions } from "./promptcontext"
import { resolveLanguageModel } from "./models"

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
        writeText: (body) => {
            body = body ?? ""
            appendChild(
                node,
                createTextNode(body.replace(/\n*$/, "").replace(/^\n*/, ""))
            )
        },
        $(strings, ...args) {
            appendChild(node, createStringTemplateNode(strings, args))
        },
        def(name, body, options) {
            name = name ?? ""
            // shortcuts
            if (body === undefined || body === null) return undefined
            else if (Array.isArray(body))
                body.forEach((f) => ctx.def(name, f, options))
            else if (typeof body === "object" && body.filename) {
                const { glob, endsWith } = options || {}
                const filename = body.filename
                if (glob && filename) {
                    const match = minimatch(filename, glob)
                    if (!match) return undefined
                }
                if (endsWith && !filename.endsWith(endsWith)) return undefined
                appendChild(node, createDefNode(name, body, env, options))
            } else if (typeof body === "string") {
                appendChild(
                    node,
                    createDefNode(
                        name,
                        { filename: "", label: "", content: body },
                        env,
                        options
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
                const ctx = createRunPromptContext(options, env, trace)
                const model =
                    promptOptions?.model ?? options.model ?? DEFAULT_MODEL
                await generator(ctx)
                const node = ctx.node

                if (cancellationToken?.isCancellationRequested)
                    return { text: "Prompt cancelled", finishReason: "cancel" }

                // expand template
                const { prompt, images, errors } = await renderPromptNode(
                    model,
                    node,
                    {
                        trace,
                    }
                )
                trace.fence(prompt, "markdown")
                if (images?.length || errors?.length)
                    trace.fence({ images, errors }, "yaml")

                // call LLM
                const { completer } = resolveLanguageModel(model, options)
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
                        messages: [toChatCompletionUserMessage(prompt, images)],
                    },
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
