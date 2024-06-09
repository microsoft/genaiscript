import { minimatch } from "minimatch"
import {
    PromptNode,
    appendChild,
    createAssistantNode,
    createChatParticipant,
    createDefDataNode,
    createDefNode,
    createFunctionNode,
    createImageNode,
    createSchemaNode,
    createStringTemplateNode,
    createTextNode,
    renderPromptNode,
} from "./promptdom"
import { MarkdownTrace } from "./trace"
import {
    ChatCompletionMessageParam,
    executeChatSession,
    mergeGenerationOptions,
} from "./chat"
import { GenerationOptions } from "./promptcontext"
import { parseModelIdentifier, resolveModelConnectionInfo } from "./models"
import { renderAICI } from "./aici"
import { CancelError, isCancelError, serializeError } from "./error"
import { checkCancelled } from "./cancellation"
import { MODEL_PROVIDER_AICI } from "./constants"
import { promptParametersSchemaToJSONSchema } from "./parameters"
import { isJSONSchema } from "./schema"
import { consoleLogFormat } from "./logging"
import { host } from "./host"
import { resolveFileDataUri } from "./file"

export interface RunPromptContextNode extends PromptGenerationContext {
    node: PromptNode
}

export function createRunPromptContext(
    options: GenerationOptions,
    env: ExpansionVariables,
    trace: MarkdownTrace
): RunPromptContextNode {
    const { cancellationToken, infoCb } = options || {}
    const node: PromptNode = { children: [] }

    const log = (...args: any[]) => {
        const line = consoleLogFormat(...args)
        if (line) trace.log(line)
    }
    const console = Object.freeze<PromptGenerationConsole>({
        log,
        debug: log,
        warn: (args) => trace.warn(consoleLogFormat(...args)),
        error: (args) => trace.error(consoleLogFormat(...args)),
    })

    const defTool: (
        name: string,
        description: string,
        parameters: PromptParametersSchema | JSONSchema,
        fn: ChatFunctionHandler
    ) => void = (name, description, parameters, fn) => {
        const parameterSchema = isJSONSchema(parameters)
            ? (parameters as JSONSchema)
            : promptParametersSchemaToJSONSchema(
                  parameters as PromptParametersSchema
              )
        appendChild(
            node,
            createFunctionNode(name, description, parameterSchema, fn)
        )
    }

    const defSchema = (
        name: string,
        schema: JSONSchema,
        defOptions?: DefSchemaOptions
    ) => {
        appendChild(node, createSchemaNode(name, schema, defOptions))

        return name
    }

    const defImages = (files: StringLike, defOptions?: DefImagesOptions) => {
        const { detail } = defOptions || {}
        if (Array.isArray(files))
            files.forEach((file) => defImages(file, defOptions))
        else if (typeof files === "string")
            appendChild(node, createImageNode({ url: files, detail }))
        else {
            const file: WorkspaceFile = files
            appendChild(
                node,
                createImageNode(
                    (async () => {
                        const url = await resolveFileDataUri(file, { trace })
                        return {
                            url,
                            filename: file.filename,
                            detail,
                        }
                    })()
                )
            )
        }
    }

    const defChatParticipant = (participant: ChatParticipantHandler) => {
        appendChild(node, createChatParticipant(participant))
    }

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
            if (body === undefined || body === null) {
                if (!doptions.ignoreEmpty)
                    throw new CancelError(`def ${name} is ${body}`)
                return undefined
            } else if (Array.isArray(body)) {
                if (body.length === 0 && !doptions.ignoreEmpty)
                    throw new CancelError(`def ${name} files is empty`)
                body.forEach((f) => ctx.def(name, f, defOptions))
            } else if (typeof body === "object" && body.filename) {
                const { glob, endsWith } = defOptions || {}
                const filename = body.filename
                if (glob && filename) {
                    const match = minimatch(filename, glob, {
                        windowsPathsNoEscape: true,
                    })
                    if (!match) return undefined
                }
                if (endsWith && !filename.endsWith(endsWith)) return undefined
                appendChild(node, createDefNode(name, body, doptions))
            } else if (typeof body === "string") {
                if (body.trim() === "" && !doptions.ignoreEmpty)
                    throw new CancelError(`def ${name} is empty`)
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
        defData: (name, data, defOptions) => {
            appendChild(node, createDefDataNode(name, data, defOptions))
            return name
        },
        defTool,
        defSchema,
        defImages,
        defChatParticipant,
        fence(body, options?: DefOptions) {
            ctx.def("", body, options)
            return undefined
        },
        runPrompt: async (generator, runOptions) => {
            try {
                const { label } = runOptions || {}
                trace.startDetails(`🎁 run prompt ${label || ""}`)
                infoCb?.({ text: `run prompt ${label || ""}` })

                const genOptions = mergeGenerationOptions(options, runOptions)
                const ctx = createRunPromptContext(genOptions, env, trace)
                if (typeof generator === "string")
                    ctx.node.children.push(createTextNode(generator))
                else await generator(ctx)
                const node = ctx.node

                checkCancelled(cancellationToken)

                let messages: ChatCompletionMessageParam[] = []
                let functions: ChatFunctionCallback[] = undefined
                let schemas: Record<string, JSONSchema> = undefined
                let chatParticipants: ChatParticipantHandler[] = undefined
                // expand template
                const { provider } = parseModelIdentifier(genOptions.model)
                if (provider === MODEL_PROVIDER_AICI) {
                    const { aici } = await renderAICI("prompt", node)
                    // todo: output processor?
                    messages.push(aici)
                } else {
                    const {
                        errors,
                        schemas: scs,
                        functions: fns,
                        messages: msgs,
                        chatParticipants: cps,
                    } = await renderPromptNode(genOptions.model, node, {
                        trace,
                    })

                    schemas = scs
                    functions = fns
                    chatParticipants = cps
                    messages.push(...msgs)

                    if (errors?.length)
                        throw new Error("errors while running prompt")
                }

                const connection = await resolveModelConnectionInfo(
                    genOptions,
                    { trace, token: true }
                )
                if (!connection.configuration)
                    throw new Error("model connection error " + connection.info)
                const { completer } = await host.resolveLanguageModel(
                    genOptions,
                    connection.configuration
                )
                if (!completer)
                    throw new Error(
                        "model driver not found for " + connection.info
                    )
                const resp = await executeChatSession(
                    connection.configuration,
                    cancellationToken,
                    messages,
                    functions,
                    schemas,
                    completer,
                    chatParticipants,
                    genOptions
                )
                const { json, text } = resp
                if (resp.json)
                    trace.detailsFenced("📩 json (parsed)", json, "json")
                else if (text)
                    trace.detailsFenced(`🔠 output`, text, `markdown`)
                return resp
            } catch (e) {
                trace.error(e)
                return {
                    finishReason: isCancelError(e) ? "cancel" : "fail",
                    error: serializeError(e),
                }
            } finally {
                trace.endDetails()
            }
        },
        console,
    }

    return ctx
}
