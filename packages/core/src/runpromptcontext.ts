import {
    PromptNode,
    appendChild,
    createAssistantNode,
    createChatParticipant,
    createDefData,
    createDef,
    createFileOutput,
    createFunctionNode,
    createImageNode,
    createImportTemplate,
    createSchemaNode,
    createStringTemplateNode,
    createTextNode,
} from "./promptdom"
import { MarkdownTrace } from "./trace"
import { GenerationOptions } from "./generation"
import { promptParametersSchemaToJSONSchema } from "./parameters"
import { consoleLogFormat } from "./logging"
import { isGlobMatch } from "./glob"
import { arrayify, logVerbose } from "./util"
import { renderShellOutput } from "./chatrender"
import { jinjaRender } from "./jinja"
import { mustacheRender } from "./mustache"
import { imageEncodeForLLM } from "./image"

export function createChatTurnGenerationContext(
    options: GenerationOptions,
    trace: MarkdownTrace
): ChatTurnGenerationContext & { node: PromptNode } {
    const node: PromptNode = { children: [] }

    const log = (...args: any[]) => {
        const line = consoleLogFormat(...args)
        if (line) {
            trace.log(line)
            logVerbose(line)
        }
    }
    const console = Object.freeze<PromptGenerationConsole>({
        log,
        debug: log,
        warn: log,
        error: log,
    })

    const ctx = <ChatTurnGenerationContext & { node: PromptNode }>{
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
        assistant: (body, options) =>
            ctx.writeText(body, { ...options, assistant: true }),
        $(strings, ...args) {
            const current = createStringTemplateNode(strings, args)
            appendChild(node, current)
            const res: PromptTemplateString = Object.freeze(<
                PromptTemplateString
            >{
                priority: (priority) => {
                    current.priority = priority
                    return res
                },
                flex: (value) => {
                    current.flex = value
                    return res
                },
                jinja: (data) => {
                    current.transforms.push((t) => jinjaRender(t, data))
                    return res
                },
                mustache: (data) => {
                    current.transforms.push((t) => mustacheRender(t, data))
                    return res
                },
                maxTokens: (tokens) => {
                    current.maxTokens = tokens
                    return res
                },
            })
            return res
        },
        def(name, body, defOptions) {
            name = name ?? ""
            const doptions = { ...(defOptions || {}), trace }
            doptions.lineNumbers = doptions.lineNumbers ?? options.lineNumbers
            // shortcuts
            if (body === undefined || body === null) {
                if (!doptions.ignoreEmpty)
                    throw new Error(`def ${name} is ${body}`)
                return undefined
            } else if (Array.isArray(body)) {
                if (body.length === 0 && !doptions.ignoreEmpty)
                    throw new Error(`def ${name} is empty`)
                body.forEach((f) => ctx.def(name, f, defOptions))
            } else if (typeof body === "string") {
                if (body.trim() === "" && !doptions.ignoreEmpty)
                    throw new Error(`def ${name} is empty`)
                appendChild(
                    node,
                    createDef(name, { filename: "", content: body }, doptions)
                )
            } else if (
                typeof body === "object" &&
                (body as WorkspaceFile).filename
            ) {
                const file = body as WorkspaceFile
                const { glob, endsWith } = defOptions || {}
                const { filename } = file
                if (glob && filename) {
                    if (!isGlobMatch(filename, glob)) return undefined
                }
                if (endsWith && !filename.endsWith(endsWith)) return undefined
                appendChild(node, createDef(name, file, doptions))
            } else if (
                typeof body === "object" &&
                (body as ShellOutput).exitCode !== undefined
            ) {
                appendChild(
                    node,
                    createDef(
                        name,
                        {
                            filename: "",
                            content: renderShellOutput(body as ShellOutput),
                        },
                        { ...doptions, lineNumbers: false }
                    )
                )
            } else if (typeof body === "object" && (body as Fenced).content) {
                const fenced = body as Fenced
                appendChild(
                    node,
                    createDef(
                        name,
                        { filename: "", content: (body as Fenced).content },
                        { language: fenced.language, ...(doptions || {}) }
                    )
                )
            }

            // TODO: support clause
            return name
        },
        defData: (name, data, defOptions) => {
            appendChild(node, createDefData(name, data, defOptions))
            return name
        },
        fence(body, options?: DefOptions) {
            ctx.def("", body, options)
            return undefined
        },
        importTemplate: (template, data, options) => {
            appendChild(node, createImportTemplate(template, data, options))
            return undefined
        },
        console,
    }

    return ctx
}

export interface RunPromptContextNode extends ChatGenerationContext {
    node: PromptNode
}

export function createChatGenerationContext(
    options: GenerationOptions,
    trace: MarkdownTrace
): RunPromptContextNode {
    const turnCtx = createChatTurnGenerationContext(options, trace)
    const node = turnCtx.node

    const defTool: (
        name:
            | string
            | ToolCallback
            | AgenticToolCallback
            | AgenticToolProviderCallback,
        description: string,
        parameters: PromptParametersSchema | JSONSchemaObject,
        fn: ChatFunctionHandler
    ) => void = (name, description, parameters, fn) => {
        if (name === undefined || name === null)
            throw new Error("tool name is missing")

        if (typeof name === "string") {
            const parameterSchema =
                promptParametersSchemaToJSONSchema(parameters)
            appendChild(
                node,
                createFunctionNode(name, description, parameterSchema, fn)
            )
        } else if ((name as ToolCallback | AgenticToolCallback).impl) {
            const tool = name as ToolCallback | AgenticToolCallback
            appendChild(
                node,
                createFunctionNode(
                    tool.spec.name,
                    tool.spec.description,
                    tool.spec.parameters as any,
                    tool.impl
                )
            )
        } else if ((name as AgenticToolProviderCallback).functions) {
            const tools = (name as AgenticToolProviderCallback).functions
            for (const tool of tools)
                appendChild(
                    node,
                    createFunctionNode(
                        tool.spec.name,
                        tool.spec.description,
                        tool.spec.parameters as any,
                        tool.impl
                    )
                )
        }
    }

    const defSchema = (
        name: string,
        schema: JSONSchema,
        defOptions?: DefSchemaOptions
    ) => {
        appendChild(node, createSchemaNode(name, schema, defOptions))

        return name
    }

    const defImages = (
        files: ElementOrArray<string | WorkspaceFile | Buffer | Blob>,
        defOptions?: DefImagesOptions
    ) => {
        const { detail } = defOptions || {}
        if (Array.isArray(files))
            files.forEach((file) => defImages(file, defOptions))
        else if (
            typeof files === "string" ||
            files instanceof Blob ||
            files instanceof Buffer
        ) {
            const img = files
            appendChild(
                node,
                createImageNode(
                    (async () => {
                        const url = await imageEncodeForLLM(img, {
                            ...defOptions,
                            trace,
                        })
                        return {
                            url,
                            detail,
                        }
                    })()
                )
            )
        } else {
            const file: WorkspaceFile = files
            appendChild(
                node,
                createImageNode(
                    (async () => {
                        const url = await imageEncodeForLLM(file.filename, {
                            ...defOptions,
                            trace,
                        })
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

    const defChatParticipant = (
        generator: ChatParticipantHandler,
        options?: ChatParticipantOptions
    ) => {
        if (generator)
            appendChild(node, createChatParticipant({ generator, options }))
    }

    const defFileOutput = (
        pattern: string,
        description: string,
        options?: FileOutputOptions
    ): void => {
        if (pattern)
            appendChild(
                node,
                createFileOutput({
                    pattern: arrayify(pattern),
                    description,
                    options,
                })
            )
    }

    const ctx = <RunPromptContextNode>{
        ...turnCtx,
        defTool,
        defSchema,
        defImages,
        defChatParticipant,
        defFileOutput,
    }

    return ctx
}
