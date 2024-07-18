import { CSVToMarkdown, CSVTryParse } from "./csv"
import { renderFileContent, resolveFileContent } from "./file"
import { addLineNumbers } from "./liner"
import { JSONSchemaStringifyToTypeScript } from "./schema"
import { estimateTokens } from "./tokens"
import { MarkdownTrace, TraceOptions } from "./trace"
import { assert, toStringList, trimNewlines } from "./util"
import { YAMLStringify } from "./yaml"
import { MARKDOWN_PROMPT_FENCE, PROMPT_FENCE } from "./constants"
import { parseModelIdentifier } from "./models"
import { toChatCompletionUserMessage } from "./chat"
import { errorMessage } from "./error"
import { tidyData } from "./tidy"
import { inspect } from "./logging"
import { dedent } from "./indent"
import {
    ChatCompletionAssistantMessageParam,
    ChatCompletionMessageParam,
} from "./chattypes"

export interface PromptNode extends ContextExpansionOptions {
    type?:
        | "text"
        | "image"
        | "schema"
        | "function"
        | "fileMerge"
        | "outputProcessor"
        | "stringTemplate"
        | "assistant"
        | "def"
        | "chatParticipant"
        | "fileOutput"
        | undefined
    children?: PromptNode[]
    error?: unknown
    tokens?: number
    /**
     * Rendered markdown preview of the node
     */
    preview?: string
}

export interface PromptTextNode extends PromptNode {
    type: "text"
    value: Awaitable<string>
    resolved?: string
}

export interface PromptDefNode extends PromptNode, DefOptions {
    type: "def"
    name: string
    value: Awaitable<WorkspaceFile>
    resolved?: WorkspaceFile
}

export interface PromptAssistantNode extends PromptNode {
    type: "assistant"
    value: Awaitable<string>
    resolved?: string
}

export interface PromptStringTemplateNode extends PromptNode {
    type: "stringTemplate"
    strings: TemplateStringsArray
    args: any[]
    resolved?: string
}

export interface PromptImage {
    url: string
    filename?: string
    detail?: "low" | "high"
}

export interface PromptImageNode extends PromptNode {
    type: "image"
    value: Awaitable<PromptImage>
    resolved?: PromptImage
}

export interface PromptSchemaNode extends PromptNode {
    type: "schema"
    name: string
    value: JSONSchema
    options?: DefSchemaOptions
}

export interface PromptFunctionNode extends PromptNode {
    type: "function"
    name: string
    description: string
    parameters: JSONSchema
    fn: ChatFunctionHandler
}

export interface PromptFileMergeNode extends PromptNode {
    type: "fileMerge"
    fn: FileMergeHandler
}

export interface PromptOutputProcessorNode extends PromptNode {
    type: "outputProcessor"
    fn: PromptOutputProcessorHandler
}

export interface PromptChatParticipantNode extends PromptNode {
    type: "chatParticipant"
    participant: ChatParticipant
    options?: ChatParticipantOptions
}

export interface FileOutputNode extends PromptNode {
    type: "fileOutput"
    output: FileOutput
}

export function createTextNode(
    value: Awaitable<string>,
    options?: ContextExpansionOptions
): PromptTextNode {
    assert(value !== undefined)
    return { type: "text", value, ...(options || {}) }
}

export function createDefNode(
    name: string,
    file: WorkspaceFile,
    options: DefOptions & TraceOptions
): PromptDefNode {
    name = name ?? ""
    const render = async () => {
        await resolveFileContent(file, options)
        const res = await renderFileContent(file, options)
        return res
    }
    const value = render()
    return { type: "def", name, value, ...(options || {}) }
}

function renderDefNode(def: PromptDefNode): string {
    const { name, resolved } = def
    const file = resolved
    const { language, lineNumbers, schema } = def || {}
    const fence =
        language === "markdown" || language === "mdx"
            ? MARKDOWN_PROMPT_FENCE
            : PROMPT_FENCE
    const norm = (s: string, lang: string) => {
        s = (s || "").replace(/\n*$/, "")
        if (s && lineNumbers) s = addLineNumbers(s, lang)
        if (s) s += "\n"
        return s
    }

    let dfence =
        /\.mdx?$/i.test(file.filename) || file.content?.includes(fence)
            ? MARKDOWN_PROMPT_FENCE
            : fence
    const dtype = language || /\.([^\.]+)$/i.exec(file.filename)?.[1] || ""
    let body = file.content
    if (/^(c|t)sv$/i.test(dtype)) {
        const parsed = CSVTryParse(file.content)
        if (parsed) {
            body = CSVToMarkdown(parsed)
            dfence = ""
        }
    }
    body = norm(body, dtype)
    while (dfence && body.includes(dfence)) {
        dfence += "`"
    }
    const res =
        (name ? name + ":\n" : "") +
        dfence +
        dtype +
        (file.filename ? ` file="${file.filename}"` : "") +
        (schema ? ` schema=${schema}` : "") +
        "\n" +
        body +
        dfence +
        "\n"

    return res
}

export function createAssistantNode(
    value: Awaitable<string>,
    options?: ContextExpansionOptions
): PromptAssistantNode {
    assert(value !== undefined)
    return { type: "assistant", value, ...(options || {}) }
}

export function createStringTemplateNode(
    strings: TemplateStringsArray,
    args: any[],
    options?: ContextExpansionOptions
): PromptStringTemplateNode {
    assert(strings !== undefined)
    return { type: "stringTemplate", strings, args, ...(options || {}) }
}

export function createImageNode(
    value: Awaitable<PromptImage>,
    options?: ContextExpansionOptions
): PromptImageNode {
    assert(value !== undefined)
    return { type: "image", value, ...(options || {}) }
}

export function createSchemaNode(
    name: string,
    value: JSONSchema,
    options?: DefSchemaOptions
): PromptSchemaNode {
    assert(!!name)
    assert(value !== undefined)
    return { type: "schema", name, value, options }
}

export function createFunctionNode(
    name: string,
    description: string,
    parameters: JSONSchema,
    fn: ChatFunctionHandler
): PromptFunctionNode {
    assert(!!name)
    assert(!!description)
    assert(parameters !== undefined)
    assert(fn !== undefined)
    return { type: "function", name, description, parameters, fn }
}

export function createFileMergeNode(fn: FileMergeHandler): PromptFileMergeNode {
    assert(fn !== undefined)
    return { type: "fileMerge", fn }
}

export function createOutputProcessor(
    fn: PromptOutputProcessorHandler
): PromptOutputProcessorNode {
    assert(fn !== undefined)
    return { type: "outputProcessor", fn }
}

export function createChatParticipant(
    participant: ChatParticipant
): PromptChatParticipantNode {
    return { type: "chatParticipant", participant }
}

export function createFileOutput(output: FileOutput): FileOutputNode {
    return { type: "fileOutput", output }
}

export function createDefDataNode(
    name: string,
    data: object | object[],
    options?: DefDataOptions
) {
    if (data === undefined) return undefined
    let { format, headers, priority } = options || {}
    if (!format && headers && Array.isArray(data)) format = "csv"
    else if (!format) format = "yaml"

    if (Array.isArray(data)) data = tidyData(data as object[], options)

    let text: string
    let lang: string
    if (Array.isArray(data) && format === "csv") {
        text = CSVToMarkdown(data)
    } else if (format === "json") {
        text = JSON.stringify(data)
        lang = "json"
    } else {
        text = YAMLStringify(data)
        lang = "yaml"
    }

    const value = lang
        ? `${name}:
\`\`\`${lang}
${trimNewlines(text)}
\`\`\`
`
        : `${name}:
${trimNewlines(text)}
`
    // TODO maxTokens does not work well with data
    return createTextNode(value, { priority })
}

export function appendChild(parent: PromptNode, child: PromptNode): void {
    if (!parent.children) {
        parent.children = []
    }
    parent.children.push(child)
}

export interface PromptNodeVisitor {
    node?: (node: PromptNode) => Awaitable<void>
    error?: (node: PromptNode) => Awaitable<void>
    afterNode?: (node: PromptNode) => Awaitable<void>
    text?: (node: PromptTextNode) => Awaitable<void>
    def?: (node: PromptDefNode) => Awaitable<void>
    image?: (node: PromptImageNode) => Awaitable<void>
    schema?: (node: PromptSchemaNode) => Awaitable<void>
    function?: (node: PromptFunctionNode) => Awaitable<void>
    fileMerge?: (node: PromptFileMergeNode) => Awaitable<void>
    stringTemplate?: (node: PromptStringTemplateNode) => Awaitable<void>
    outputProcessor?: (node: PromptOutputProcessorNode) => Awaitable<void>
    assistant?: (node: PromptAssistantNode) => Awaitable<void>
    chatParticipant?: (node: PromptChatParticipantNode) => Awaitable<void>
    fileOutput?: (node: FileOutputNode) => Awaitable<void>
}

export async function visitNode(node: PromptNode, visitor: PromptNodeVisitor) {
    await visitor.node?.(node)
    switch (node.type) {
        case "text":
            await visitor.text?.(node as PromptTextNode)
            break
        case "def":
            await visitor.def?.(node as PromptDefNode)
            break
        case "image":
            await visitor.image?.(node as PromptImageNode)
            break
        case "schema":
            await visitor.schema?.(node as PromptSchemaNode)
            break
        case "function":
            await visitor.function?.(node as PromptFunctionNode)
            break
        case "fileMerge":
            await visitor.fileMerge?.(node as PromptFileMergeNode)
            break
        case "outputProcessor":
            await visitor.outputProcessor?.(node as PromptOutputProcessorNode)
            break
        case "stringTemplate":
            await visitor.stringTemplate?.(node as PromptStringTemplateNode)
            break
        case "assistant":
            await visitor.assistant?.(node as PromptAssistantNode)
            break
        case "chatParticipant":
            await visitor.chatParticipant?.(node as PromptChatParticipantNode)
            break
        case "fileOutput":
            await visitor.fileOutput?.(node as FileOutputNode)
    }
    if (node.error) visitor.error?.(node)
    if (!node.error && node.children) {
        for (const child of node.children) {
            await visitNode(child, visitor)
        }
    }
    await visitor.afterNode?.(node)
}

export interface PromptNodeRender {
    prompt: string
    assistantPrompt: string
    images: PromptImage[]
    errors: unknown[]
    schemas: Record<string, JSONSchema>
    functions: ToolCallback[]
    fileMerges: FileMergeHandler[]
    outputProcessors: PromptOutputProcessorHandler[]
    chatParticipants: ChatParticipant[]
    messages: ChatCompletionMessageParam[]
    fileOutputs: FileOutput[]
}

async function resolvePromptNode(
    model: string,
    root: PromptNode
): Promise<{ errors: number }> {
    let err = 0
    await visitNode(root, {
        error: () => {
            err++
        },
        text: async (n) => {
            try {
                const value = await n.value
                n.resolved = n.preview = value
                n.tokens = estimateTokens(value, { model })
            } catch (e) {
                n.error = e
            }
        },
        def: async (n) => {
            try {
                const value = await n.value
                n.resolved = value
                const rendered = renderDefNode(n)
                n.preview = rendered
                n.tokens = estimateTokens(rendered, { model })
            } catch (e) {
                n.error = e
            }
        },
        assistant: async (n) => {
            try {
                const value = await n.value
                n.resolved = n.preview = value
                n.tokens = estimateTokens(value, { model })
            } catch (e) {
                n.error = e
            }
        },
        stringTemplate: async (n) => {
            const { strings, args } = n
            try {
                const resolvedArgs: any[] = []
                for (const arg of args) {
                    let resolvedArg = await arg
                    if (typeof resolvedArg === "function")
                        resolvedArg = resolvedArg()
                    // render objects
                    if (
                        typeof resolvedArg === "object" ||
                        Array.isArray(resolvedArg)
                    )
                        resolvedArg = inspect(resolvedArg, {
                            maxDepth: 3,
                        })
                    resolvedArgs.push(resolvedArg ?? "")
                }
                const value = dedent(strings, ...resolvedArgs)
                n.resolved = n.preview = value
                n.tokens = estimateTokens(value, { model })
            } catch (e) {
                n.error = e
            }
        },
        image: async (n) => {
            try {
                const v = await n.value
                n.resolved = v
                n.preview = `![${v.filename ?? "image"}](${v.url})`
            } catch (e) {
                n.error = e
            }
        },
    })
    return { errors: err }
}

async function truncatePromptNode(
    model: string,
    node: PromptNode,
    options?: TraceOptions
): Promise<boolean> {
    const { trace } = options || {}
    let truncated = false

    const cap = (n: {
        error?: unknown
        resolved?: string
        tokens?: number
        maxTokens?: number
    }) => {
        if (
            !n.error &&
            n.resolved !== undefined &&
            n.maxTokens !== undefined &&
            n.tokens > n.maxTokens
        ) {
            const value = n.resolved.slice(
                0,
                Math.floor((n.maxTokens * n.resolved.length) / n.tokens)
            )
            n.resolved = value
            n.tokens = estimateTokens(value, { model })
            truncated = true
        }
    }

    const capDef = (n: PromptDefNode) => {
        if (
            !n.error &&
            n.resolved !== undefined &&
            n.maxTokens !== undefined &&
            n.tokens > n.maxTokens
        ) {
            n.resolved.content = n.resolved.content.slice(
                0,
                Math.floor((n.maxTokens * n.resolved.content.length) / n.tokens)
            )
            n.tokens = estimateTokens(n.resolved.content, { model })
            truncated = true
        }
    }

    await visitNode(node, {
        text: cap,
        assistant: cap,
        stringTemplate: cap,
        def: capDef,
    })

    return truncated
}

async function tracePromptNode(
    trace: MarkdownTrace,
    root: PromptNode,
    options?: { label: string }
) {
    if (!trace) return

    await visitNode(root, {
        node: (n) => {
            const error = errorMessage(n.error)
            let title = toStringList(
                n.type || `🌳 prompt tree ${options?.label || ""}`,
                n.priority ? `#${n.priority}` : undefined
            )
            const value = toStringList(
                n.tokens
                    ? `${n.tokens}${n.maxTokens ? `/${n.maxTokens}` : ""}t`
                    : undefined,
                error
            )
            if (value.length > 0) title += `: ${value}`
            if (n.children?.length || n.preview) {
                trace.startDetails(title, n.error ? false : undefined)
                if (n.preview) trace.fence(n.preview, "markdown")
            } else trace.resultItem(!n.error, title)
        },
        afterNode: (n) => {
            if (n.children?.length || n.preview) trace.endDetails()
        },
    })
}

export async function renderPromptNode(
    modelId: string,
    node: PromptNode,
    options?: TraceOptions
): Promise<PromptNodeRender> {
    const { trace } = options || {}
    const { model } = parseModelIdentifier(modelId)

    await resolvePromptNode(model, node)
    await tracePromptNode(trace, node)

    const truncated = await truncatePromptNode(model, node, options)
    if (truncated) await tracePromptNode(trace, node, { label: "truncated" })

    let prompt = ""
    let assistantPrompt = ""
    const images: PromptImage[] = []
    const errors: unknown[] = []
    const schemas: Record<string, JSONSchema> = {}
    const functions: ToolCallback[] = []
    const fileMerges: FileMergeHandler[] = []
    const outputProcessors: PromptOutputProcessorHandler[] = []
    const chatParticipants: ChatParticipant[] = []
    const fileOutputs: FileOutput[] = []

    await visitNode(node, {
        text: async (n) => {
            if (n.error) errors.push(n.error)
            const value = n.resolved
            if (value != undefined) prompt += value + "\n"
        },
        def: async (n) => {
            if (n.error) errors.push(n.error)
            const value = n.resolved
            if (value !== undefined) prompt += renderDefNode(n) + "\n"
        },
        assistant: async (n) => {
            if (n.error) errors.push(n.error)
            const value = await n.resolved
            if (value != undefined) assistantPrompt += value + "\n"
        },
        stringTemplate: async (n) => {
            if (n.error) errors.push(n.error)
            const value = n.resolved
            if (value != undefined) prompt += value + "\n"
        },
        image: async (n) => {
            if (n.error) errors.push(n.error)
            const value = n.resolved
            if (value?.url) {
                images.push(value)
                if (trace) {
                    trace.startDetails(
                        `📷 image: ${value.detail || ""} ${value.filename || value.url.slice(0, 64) + "..."}`
                    )
                    trace.image(value.url, value.filename)
                    trace.endDetails()
                }
            }
        },
        schema: (n) => {
            const { name: schemaName, value: schema, options } = n
            if (schemas[schemaName])
                trace.error("duplicate schema name: " + schemaName)
            schemas[schemaName] = schema
            const { format = "typescript" } = options || {}
            let schemaText: string
            switch (format) {
                case "json":
                    schemaText = JSON.stringify(schema, null, 2)
                    break
                case "yaml":
                    schemaText = YAMLStringify(schema)
                    break
                default:
                    schemaText = JSONSchemaStringifyToTypeScript(schema, {
                        typeName: schemaName,
                    })
                    break
            }
            const text = `${schemaName}:
\`\`\`${format + "-schema"}
${trimNewlines(schemaText)}
\`\`\`
`
            prompt += text
            n.tokens = estimateTokens(text, { model })
            if (trace && format !== "json")
                trace.detailsFenced(
                    `🧬 schema ${schemaName} as ${format}`,
                    schemaText,
                    format
                )
        },
        function: (n) => {
            const { name, description, parameters, fn } = n
            functions.push({
                definition: { name, description, parameters },
                fn,
            })
            trace.detailsFenced(
                `🛠️ tool ${name}`,
                { description, parameters },
                "yaml"
            )
        },
        fileMerge: (n) => {
            fileMerges.push(n.fn)
            trace.itemValue(`file merge`, n.fn)
        },
        outputProcessor: (n) => {
            outputProcessors.push(n.fn)
            trace.itemValue(`output processor`, n.fn.name)
        },
        chatParticipant: (n) => {
            chatParticipants.push(n.participant)
            trace.itemValue(
                `chat participant`,
                n.participant.options?.label || n.participant.generator.name
            )
        },
        fileOutput: (n) => {
            fileOutputs.push(n.output)
            trace.itemValue(`file output`, n.output.pattern)
        },
    })

    if (fileOutputs.length > 0) {
        prompt += `
## File generation rules

When generating files, follow the following rules which are formatted as "glob: description":

${fileOutputs.map((fo) => `${fo.pattern}: ${fo.description}`)}

`
    }

    const messages: ChatCompletionMessageParam[] = [
        toChatCompletionUserMessage(prompt, images),
    ]
    if (assistantPrompt)
        messages.push(<ChatCompletionAssistantMessageParam>{
            role: "assistant",
            content: assistantPrompt,
        })
    const res = {
        prompt,
        assistantPrompt,
        images,
        schemas,
        functions,
        fileMerges,
        outputProcessors,
        chatParticipants,
        errors,
        messages,
        fileOutputs,
    }
    return res
}
