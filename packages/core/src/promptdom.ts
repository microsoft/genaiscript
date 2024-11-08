// Importing various utility functions and constants from different modules.
import { CSVToMarkdown, CSVTryParse } from "./csv"
import { renderFileContent, resolveFileContent } from "./file"
import { addLineNumbers, extractRange } from "./liner"
import { JSONSchemaStringifyToTypeScript } from "./schema"
import { estimateTokens, truncateTextToTokens } from "./tokens"
import { MarkdownTrace, TraceOptions } from "./trace"
import { arrayify, assert, toStringList, trimNewlines } from "./util"
import { YAMLStringify } from "./yaml"
import {
    MARKDOWN_PROMPT_FENCE,
    PROMPT_FENCE,
    PROMPTY_REGEX,
    SANITIZED_PROMPT_INJECTION,
    TEMPLATE_ARG_DATA_SLICE_SAMPLE,
    TEMPLATE_ARG_FILE_MAX_TOKENS,
} from "./constants"
import { parseModelIdentifier } from "./models"
import {
    appendAssistantMessage,
    appendSystemMessage,
    appendUserMessage,
} from "./chat"
import { errorMessage } from "./error"
import { tidyData } from "./tidy"
import { dedent } from "./indent"
import { ChatCompletionMessageParam } from "./chattypes"
import { resolveTokenEncoder } from "./encoders"
import { expandFiles } from "./fs"
import { interpolateVariables } from "./mustache"
import { createDiff } from "./diff"
import { promptyParse } from "./prompty"
import { jinjaRenderChatMessage } from "./jinja"
import { runtimeHost } from "./host"
import { hash } from "./crypto"

// Definition of the PromptNode interface which is an essential part of the code structure.
export interface PromptNode extends ContextExpansionOptions {
    // Describes the type of the node.
    type?:
        | "text"
        | "image"
        | "schema"
        | "tool"
        | "fileMerge"
        | "outputProcessor"
        | "stringTemplate"
        | "assistant"
        | "system"
        | "def"
        | "chatParticipant"
        | "fileOutput"
        | "importTemplate"
        | undefined
    children?: PromptNode[] // Child nodes for hierarchical structure
    error?: unknown // Error information if present
    tokens?: number // Token count for the node
    /**
     * This text is likely to change within 5 to 10 minutes.
     */
    ephemeral?: boolean

    /**
     * Rendered markdown preview of the node
     */
    preview?: string
    name?: string

    /**
     * Node removed from the tree
     */
    deleted?: boolean
}

// Interface for a text node in the prompt tree.
export interface PromptTextNode extends PromptNode {
    type: "text"
    value: Awaitable<string> // The text content, potentially awaiting resolution
    resolved?: string // Resolved text content
}

// Interface for a definition node, which includes options.
export interface PromptDefNode extends PromptNode, DefOptions {
    type: "def"
    name: string // Name of the definition
    value: Awaitable<WorkspaceFile> // File associated with the definition
    resolved?: WorkspaceFile // Resolved file content
}

// Interface for an assistant node.
export interface PromptAssistantNode extends PromptNode {
    type: "assistant"
    value: Awaitable<string> // Assistant-related content
    resolved?: string // Resolved assistant content
}

export interface PromptSystemNode extends PromptNode {
    type: "system"
    value: Awaitable<string> // Assistant-related content
    resolved?: string // Resolved assistant content
}

// Interface for a string template node.
export interface PromptStringTemplateNode extends PromptNode {
    type: "stringTemplate"
    strings: TemplateStringsArray // Template strings
    args: any[] // Arguments for the template
    transforms: ((s: string) => Awaitable<string>)[] // Transform functions to apply to the template
    resolved?: string // Resolved templated content
}

// Interface for an import template node.
export interface PromptImportTemplate extends PromptNode {
    type: "importTemplate"
    files: string | string[] // Files to import
    args?: Record<string, string | number | boolean> // Arguments for the template
    options?: ImportTemplateOptions // Additional options
}

// Interface representing a prompt image.
export interface PromptImage {
    url: string // URL of the image
    filename?: string // Optional filename
    detail?: "low" | "high" // Image detail level
}

// Interface for an image node.
export interface PromptImageNode extends PromptNode {
    type: "image"
    value: Awaitable<PromptImage> // Image information
    resolved?: PromptImage // Resolved image information
}

// Interface for a schema node.
export interface PromptSchemaNode extends PromptNode {
    type: "schema"
    name: string // Name of the schema
    value: JSONSchema // Schema definition
    options?: DefSchemaOptions // Additional options
}

// Interface for a function node.
export interface PromptToolNode extends PromptNode {
    type: "tool"
    name: string // Function name
    description: string // Description of the function
    parameters: JSONSchema // Parameters for the function
    impl: ChatFunctionHandler // Implementation of the function
    options?: DefToolOptions
}

// Interface for a file merge node.
export interface PromptFileMergeNode extends PromptNode {
    type: "fileMerge"
    fn: FileMergeHandler // Handler for the file merge
}

// Interface for an output processor node.
export interface PromptOutputProcessorNode extends PromptNode {
    type: "outputProcessor"
    fn: PromptOutputProcessorHandler // Handler for the output processing
}

// Interface for a chat participant node.
export interface PromptChatParticipantNode extends PromptNode {
    type: "chatParticipant"
    participant: ChatParticipant // Chat participant information
    options?: ChatParticipantOptions // Additional options
}

// Interface for a file output node.
export interface FileOutputNode extends PromptNode {
    type: "fileOutput"
    output: FileOutput // File output information
}

// Function to create a text node.
export function createTextNode(
    value: Awaitable<string>,
    options?: ContextExpansionOptions
): PromptTextNode {
    assert(value !== undefined) // Ensure value is defined
    return { type: "text", value, ...(options || {}) }
}

// Function to create a definition node.
export function createDef(
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

export function createDefDiff(
    name: string,
    left: string | WorkspaceFile,
    right: string | WorkspaceFile,
    options?: DefDiffOptions & TraceOptions
): PromptDefNode {
    name = name ?? ""

    if (typeof left === "string") left = { filename: "", content: left }
    if (typeof right === "string") right = { filename: "", content: right }
    if (left?.content === undefined)
        left = { filename: "", content: YAMLStringify(left) }
    if (right?.content === undefined)
        right = { filename: "", content: YAMLStringify(right) }

    const render = async () => {
        await resolveFileContent(left, options)
        const l = await renderFileContent(left, options)
        await resolveFileContent(right, options)
        const r = await renderFileContent(right, options)
        return { filename: "", content: createDiff(l, r) }
    }
    const value = render()
    return { type: "def", name, value, ...(options || {}) }
}

// Function to render a definition node to a string.
function renderDefNode(def: PromptDefNode): string {
    const { name, resolved: file } = def
    const { language, lineNumbers, schema } = def || {}

    file.content = extractRange(file.content, def)

    const fence =
        language === "markdown" || language === "mdx"
            ? MARKDOWN_PROMPT_FENCE
            : PROMPT_FENCE
    const norm = (s: string, lang: string) => {
        s = (s || "").replace(/\n*$/, "")
        if (s && lineNumbers) s = addLineNumbers(s, { language: lang })
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
        const parsed = !/^\s*|/.test(file.content) && CSVTryParse(file.content)
        if (parsed) {
            body = CSVToMarkdown(parsed)
            dfence = ""
        }
    }
    body = norm(body, dtype)
    while (dfence && body.includes(dfence)) {
        dfence += "`"
    }
    const diffFormat =
        body.length > 500 ? " preferred_output_format=CHANGELOG " : ""
    const res =
        (name ? name + ":\n" : "") +
        dfence +
        dtype +
        (file.filename ? ` file="${file.filename}"` : "") +
        (schema ? ` schema=${schema}` : "") +
        diffFormat +
        "\n" +
        body +
        dfence +
        "\n"

    return res
}

// Function to create an assistant node.
export function createAssistantNode(
    value: Awaitable<string>,
    options?: ContextExpansionOptions
): PromptAssistantNode {
    assert(value !== undefined)
    return { type: "assistant", value, ...(options || {}) }
}

export function createSystemNode(
    value: Awaitable<string>,
    options?: ContextExpansionOptions
): PromptSystemNode {
    assert(value !== undefined)
    return { type: "system", value, ...(options || {}) }
}

// Function to create a string template node.
export function createStringTemplateNode(
    strings: TemplateStringsArray,
    args: any[],
    options?: ContextExpansionOptions
): PromptStringTemplateNode {
    assert(strings !== undefined)
    return {
        type: "stringTemplate",
        strings,
        args,
        transforms: [],
        ...(options || {}),
    }
}

// Function to create an image node.
export function createImageNode(
    value: Awaitable<PromptImage>,
    options?: ContextExpansionOptions
): PromptImageNode {
    assert(value !== undefined)
    return { type: "image", value, ...(options || {}) }
}

// Function to create a schema node.
export function createSchemaNode(
    name: string,
    value: JSONSchema,
    options?: DefSchemaOptions
): PromptSchemaNode {
    assert(!!name)
    assert(value !== undefined)
    return { type: "schema", name, value, options }
}

// Function to create a function node.
export function createToolNode(
    name: string,
    description: string,
    parameters: JSONSchema,
    impl: ChatFunctionHandler,
    options?: DefToolOptions
): PromptToolNode {
    assert(!!name)
    assert(!!description)
    assert(parameters !== undefined)
    assert(impl !== undefined)
    return <PromptToolNode>{
        type: "tool",
        name,
        description: dedent(description),
        parameters,
        impl,
        options,
    }
}

// Function to create a file merge node.
export function createFileMerge(fn: FileMergeHandler): PromptFileMergeNode {
    assert(fn !== undefined)
    return { type: "fileMerge", fn }
}

// Function to create an output processor node.
export function createOutputProcessor(
    fn: PromptOutputProcessorHandler
): PromptOutputProcessorNode {
    assert(fn !== undefined)
    return { type: "outputProcessor", fn }
}

// Function to create a chat participant node.
export function createChatParticipant(
    participant: ChatParticipant
): PromptChatParticipantNode {
    return { type: "chatParticipant", participant }
}

// Function to create a file output node.
export function createFileOutput(output: FileOutput): FileOutputNode {
    return { type: "fileOutput", output }
}

// Function to create an import template node.
export function createImportTemplate(
    files: string | string[],
    args?: Record<string, string | number | boolean>,
    options?: ImportTemplateOptions
): PromptImportTemplate {
    assert(!!files)
    return { type: "importTemplate", files, args, options }
}

// Function to check if data objects have the same keys and simple values.
function haveSameKeysAndSimpleValues(data: object[]): boolean {
    if (data.length === 0) return true
    const headers = Object.entries(data[0])
    return data.slice(1).every((obj) => {
        const keys = Object.entries(obj)
        return (
            headers.length === keys.length &&
            headers.every(
                (h, i) =>
                    keys[i][0] === h[0] &&
                    /^(string|number|boolean|null|undefined)$/.test(
                        typeof keys[i][1]
                    )
            )
        )
    })
}

// Function to create a text node with data.
export function createDefData(
    name: string,
    data: object | object[],
    options?: DefDataOptions
) {
    if (data === undefined) return undefined
    let { format, headers, priority } = options || {}
    if (
        !format &&
        Array.isArray(data) &&
        data.length &&
        (headers?.length || haveSameKeysAndSimpleValues(data))
    )
        format = "csv"
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

// Function to append a child node to a parent node.
export function appendChild(parent: PromptNode, child: PromptNode): void {
    if (!parent.children) {
        parent.children = []
    }
    parent.children.push(child)
}

// Interface for visiting different types of prompt nodes.
export interface PromptNodeVisitor {
    node?: (node: PromptNode) => Awaitable<void> // General node visitor
    error?: (node: PromptNode) => Awaitable<void> // Error handling visitor
    afterNode?: (node: PromptNode) => Awaitable<void> // Post node visitor
    text?: (node: PromptTextNode) => Awaitable<void> // Text node visitor
    def?: (node: PromptDefNode) => Awaitable<void> // Definition node visitor
    image?: (node: PromptImageNode) => Awaitable<void> // Image node visitor
    schema?: (node: PromptSchemaNode) => Awaitable<void> // Schema node visitor
    tool?: (node: PromptToolNode) => Awaitable<void> // Function node visitor
    fileMerge?: (node: PromptFileMergeNode) => Awaitable<void> // File merge node visitor
    stringTemplate?: (node: PromptStringTemplateNode) => Awaitable<void> // String template node visitor
    outputProcessor?: (node: PromptOutputProcessorNode) => Awaitable<void> // Output processor node visitor
    assistant?: (node: PromptAssistantNode) => Awaitable<void> // Assistant node visitor
    system?: (node: PromptSystemNode) => Awaitable<void> // System node visitor
    chatParticipant?: (node: PromptChatParticipantNode) => Awaitable<void> // Chat participant node visitor
    fileOutput?: (node: FileOutputNode) => Awaitable<void> // File output node visitor
    importTemplate?: (node: PromptImportTemplate) => Awaitable<void> // Import template node visitor
}

// Function to visit nodes in the prompt tree.
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
        case "tool":
            await visitor.tool?.(node as PromptToolNode)
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
        case "system":
            await visitor.system?.(node as PromptSystemNode)
            break
        case "chatParticipant":
            await visitor.chatParticipant?.(node as PromptChatParticipantNode)
            break
        case "fileOutput":
            await visitor.fileOutput?.(node as FileOutputNode)
            break
        case "importTemplate":
            await visitor.importTemplate?.(node as PromptImportTemplate)
            break
    }
    if (node.error) visitor.error?.(node)
    if (!node.error && !node.deleted && node.children) {
        for (const child of node.children) {
            await visitNode(child, visitor)
        }
        node.children = node.children?.filter((c) => !c.deleted)
    }
    await visitor.afterNode?.(node)
}

// Interface for representing a rendered prompt node.
export interface PromptNodeRender {
    images: PromptImage[] // Images included in the prompt
    errors: unknown[] // Errors encountered during rendering
    schemas: Record<string, JSONSchema> // Schemas included in the prompt
    functions: ToolCallback[] // Functions included in the prompt
    fileMerges: FileMergeHandler[] // File merge handlers
    outputProcessors: PromptOutputProcessorHandler[] // Output processor handlers
    chatParticipants: ChatParticipant[] // Chat participants
    messages: ChatCompletionMessageParam[] // Messages for chat completion
    fileOutputs: FileOutput[] // File outputs
}

/**
 * To optimize chat caching with openai, move defs to the back of the prompt
 * @see https://platform.openai.com/docs/guides/prompt-caching
 * @param mode
 * @param root
 */
async function layoutPromptNode(mode: string, root: PromptNode) {
    let changed = false
    await visitNode(root, {
        node: (n) => {
            // sort children
            const before = n.children?.map((c) => c.preview)?.join("\n")
            n.children?.sort(
                (a, b) => (a.ephemeral ? 1 : -1) - (b.ephemeral ? 1 : -1)
            )
            const after = n.children?.map((c) => c.preview)?.join("\n")
            changed = changed || before !== after
        },
    })
    return changed
}

// Function to resolve a prompt node.
async function resolvePromptNode(
    model: string,
    root: PromptNode
): Promise<{ errors: number }> {
    const { encode: encoder } = await resolveTokenEncoder(model)
    let err = 0
    const names = new Set<string>()
    const uniqueName = (n_: string) => {
        let i = 1
        let n = n_
        while (names.has(n)) {
            n = `${n_}${i++}`
        }
        names.add(n)
        return n
    }

    await visitNode(root, {
        error: () => {
            err++
        },
        text: async (n) => {
            try {
                const value = await n.value
                n.resolved = n.preview = value
                n.tokens = estimateTokens(value, encoder)
            } catch (e) {
                n.error = e
            }
        },
        def: async (n) => {
            try {
                names.add(n.name)
                const value = await n.value
                n.resolved = value
                const rendered = renderDefNode(n)
                n.preview = rendered
                n.tokens = estimateTokens(rendered, encoder)
            } catch (e) {
                n.error = e
            }
        },
        system: async (n) => {
            try {
                const value = await n.value
                n.resolved = n.preview = value
                n.tokens = estimateTokens(value, encoder)
            } catch (e) {
                n.error = e
            }
        },
        assistant: async (n) => {
            try {
                const value = await n.value
                n.resolved = n.preview = value
                n.tokens = estimateTokens(value, encoder)
            } catch (e) {
                n.error = e
            }
        },
        stringTemplate: async (n) => {
            const { strings, args } = n
            try {
                const resolvedStrings = await strings
                const resolvedArgs = []

                for (const arg of args) {
                    try {
                        let ra: any = await arg
                        if (typeof ra === "function") ra = ra()
                        ra = await ra

                        // Render files
                        if (typeof ra === "object") {
                            if (ra.filename) {
                                n.children = [
                                    ...(n.children ?? []),
                                    createDef(ra.filename, ra, {
                                        ignoreEmpty: true,
                                        maxTokens: TEMPLATE_ARG_FILE_MAX_TOKENS,
                                    }),
                                ]
                                ra = ra.filename
                            } else if (
                                // env.files
                                Array.isArray(ra) &&
                                ra.every(
                                    (r) => typeof r === "object" && r.filename
                                )
                            ) {
                                // env.files
                                const fname = uniqueName("FILES")
                                n.children = n.children ?? []
                                for (const r of ra) {
                                    n.children.push(
                                        createDef(fname, r, {
                                            ignoreEmpty: true,
                                            maxTokens:
                                                TEMPLATE_ARG_FILE_MAX_TOKENS,
                                        })
                                    )
                                }
                                ra = fname
                            } else {
                                const dname = uniqueName("DATA")
                                n.children = [
                                    ...(n.children ?? []),
                                    createDefData(dname, ra, {
                                        sliceSample:
                                            TEMPLATE_ARG_DATA_SLICE_SAMPLE,
                                    }),
                                ]
                                ra = dname
                            }
                        }
                        resolvedArgs.push(ra ?? "")
                    } catch (e) {
                        n.error = e
                        resolvedArgs.push(errorMessage(e))
                    }
                }
                let value = dedent(resolvedStrings, ...resolvedArgs)
                if (n.transforms?.length)
                    for (const transform of n.transforms)
                        value = await transform(value)
                n.resolved = n.preview = value
                n.tokens = estimateTokens(value, encoder)
            } catch (e) {
                n.error = e
            }
        },
        importTemplate: async (n) => {
            try {
                const { files, args, options } = n
                n.children = []
                n.preview = ""
                const fs = await (
                    await expandFiles(arrayify(files))
                ).map((filename) => <WorkspaceFile>{ filename })
                if (fs.length === 0)
                    throw new Error(`No files found for import: ${files}`)
                for (const f of fs) {
                    await resolveFileContent(f, options)
                    if (PROMPTY_REGEX.test(f.filename))
                        await resolveImportPrompty(n, f, args, options)
                    else {
                        const rendered = await interpolateVariables(
                            f.content,
                            args
                        )
                        n.children.push(createTextNode(rendered))
                        n.preview += rendered + "\n"
                    }
                }
                n.tokens = estimateTokens(n.preview, encoder)
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

async function resolveImportPrompty(
    n: PromptImportTemplate,
    f: WorkspaceFile,
    args: Record<string, string | number | boolean>,
    options: ImportTemplateOptions
) {
    const { messages } = promptyParse(f.filename, f.content)
    for (const message of messages) {
        const txt = jinjaRenderChatMessage(message, args)
        if (message.role === "assistant")
            n.children.push(createAssistantNode(txt))
        else if (message.role === "system")
            n.children.push(createSystemNode(txt))
        else n.children.push(createTextNode(txt))
        n.preview += txt + "\n"
    }
}

// Function to handle truncation of prompt nodes based on token limits.
async function truncatePromptNode(
    model: string,
    node: PromptNode,
    options?: TraceOptions
): Promise<boolean> {
    const { trace } = options || {}
    const { encode: encoder } = await resolveTokenEncoder(model)
    let truncated = false

    const cap = (n: {
        error?: unknown
        resolved?: string
        tokens?: number
        maxTokens?: number
        preview?: string
    }) => {
        if (
            !n.error &&
            n.resolved !== undefined &&
            n.maxTokens !== undefined &&
            n.tokens > n.maxTokens
        ) {
            n.resolved = n.preview = truncateTextToTokens(
                n.resolved,
                n.maxTokens,
                encoder
            )
            n.tokens = estimateTokens(n.resolved, encoder)
            truncated = true
            trace.log(
                `truncated text to ${n.tokens} tokens (max ${n.maxTokens})`
            )
        }
    }

    const capDef = (n: PromptDefNode) => {
        if (
            !n.error &&
            n.resolved !== undefined &&
            n.maxTokens !== undefined &&
            n.tokens > n.maxTokens
        ) {
            n.resolved.content = n.preview = truncateTextToTokens(
                n.resolved.content,
                n.maxTokens,
                encoder
            )
            n.tokens = estimateTokens(n.resolved.content, encoder)
            truncated = true
            trace.log(
                `truncated def ${n.name} to ${n.tokens} tokens (max ${n.maxTokens})`
            )
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

// Function to adjust token limits for nodes with flexibility.
async function flexPromptNode(
    root: PromptNode,
    options?: { flexTokens: number } & TraceOptions
): Promise<void> {
    const PRIORITY_DEFAULT = 0

    const { trace, flexTokens } = options || {}

    let log = ""
    // Collect all nodes
    const nodes: PromptNode[] = []
    await visitNode(root, {
        node: (n) => {
            nodes.push(n)
        },
    })
    const totalTokens = nodes.reduce(
        (total, node) => total + (node.tokens ?? 0),
        0
    )

    if (totalTokens <= flexTokens) {
        // No need to flex
        return
    }

    // Inspired from priompt, prompt-tsx, gpt-4
    // Sort by priority
    nodes.sort(
        (a, b) =>
            (a.priority ?? PRIORITY_DEFAULT) - (b.priority ?? PRIORITY_DEFAULT)
    )
    const flexNodes = nodes.filter((n) => n.flex !== undefined)
    const totalFlexTokens = flexNodes.reduce(
        (total, node) => total + (node.tokens ?? 0),
        0
    )

    // checking flexNodes sizes
    if (totalFlexTokens <= flexTokens) {
        return
    }

    const totalFlex = flexNodes.reduce((total, node) => total + node.flex, 0)
    const totalReserve = 0
    const totalRemaining = Math.max(0, flexTokens - totalReserve)
    for (const node of flexNodes) {
        const proportion = node.flex / totalFlex
        const tokenBudget = Math.min(
            node.maxTokens ?? Infinity,
            Math.floor(totalRemaining * proportion)
        )
        node.maxTokens = tokenBudget
        log += `- flexed ${node.type} ${node.name || ""} to ${tokenBudget} tokens\n`
    }
    if (log) trace?.details(`flexing`, log)
}

// Function to trace the prompt node structure for debugging.
async function tracePromptNode(
    trace: MarkdownTrace,
    root: PromptNode,
    options?: { label: string }
) {
    if (!trace || !root.children?.length) return

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
                trace.startDetails(title, {
                    success: n.error ? false : undefined,
                })
                if (n.preview) trace.fence(n.preview, "markdown")
            } else trace.resultItem(!n.error, title)
            if (n.error) trace.error(undefined, n.error)
        },
        afterNode: (n) => {
            if (n.children?.length || n.preview) trace.endDetails()
        },
    })
}

async function validateSafetyPromptNode(
    trace: MarkdownTrace,
    root: PromptNode
) {
    let mod = false
    await visitNode(root, {
        def: async (n) => {
            if (n.detectPromptInjection && n.resolved?.content) {
                const { detectPromptInjection } =
                    (await runtimeHost.contentSafety(undefined, {
                        trace,
                    })) || {}
                if (
                    (!detectPromptInjection &&
                        n.detectPromptInjection === true) ||
                    n.detectPromptInjection === "always"
                )
                    throw new Error("content safety service not available")
                const { attackDetected } =
                    (await detectPromptInjection?.(n.resolved)) || {}
                if (attackDetected) {
                    mod = true
                    n.resolved = {
                        filename: n.resolved.filename,
                        content: SANITIZED_PROMPT_INJECTION,
                    }
                    n.preview = SANITIZED_PROMPT_INJECTION
                    n.error = `safety: prompt injection detected`
                    trace.error(
                        `safety: prompt injection detected in ${n.resolved.filename}`
                    )
                }
            }
        },
    })
    return mod
}

async function deduplicatePromptNode(trace: MarkdownTrace, root: PromptNode) {
    let mod = false

    const defs = new Set<string>()
    await visitNode(root, {
        def: async (n) => {
            const key = await hash(n)
            if (defs.has(key)) {
                trace.log(`duplicate definition and content: ${n.name}`)
                n.deleted = true
                mod = true
            } else {
                defs.add(key)
            }
        },
    })
    return mod
}

// Main function to render a prompt node.
export async function renderPromptNode(
    modelId: string,
    node: PromptNode,
    options?: { flexTokens?: number } & TraceOptions
): Promise<PromptNodeRender> {
    const { trace, flexTokens } = options || {}
    const { model } = parseModelIdentifier(modelId)
    const { encode: encoder } = await resolveTokenEncoder(model)

    await resolvePromptNode(model, node)
    await tracePromptNode(trace, node)

    if (await deduplicatePromptNode(trace, node))
        await tracePromptNode(trace, node, { label: "deduplicate" })

    if (await layoutPromptNode(model, node))
        await tracePromptNode(trace, node, { label: "layout" })

    if (flexTokens)
        await flexPromptNode(node, {
            ...options,
            flexTokens,
        })

    const truncated = await truncatePromptNode(model, node, options)
    if (truncated) await tracePromptNode(trace, node, { label: "truncated" })

    const safety = await validateSafetyPromptNode(trace, node)
    if (safety) await tracePromptNode(trace, node, { label: "safety" })

    const messages: ChatCompletionMessageParam[] = []
    const appendSystem = (content: string) =>
        appendSystemMessage(messages, content)
    const appendUser = (content: string) => appendUserMessage(messages, content)
    const appendAssistant = (content: string) =>
        appendAssistantMessage(messages, content)

    const images: PromptImage[] = []
    const errors: unknown[] = []
    const schemas: Record<string, JSONSchema> = {}
    const tools: ToolCallback[] = []
    const fileMerges: FileMergeHandler[] = []
    const outputProcessors: PromptOutputProcessorHandler[] = []
    const chatParticipants: ChatParticipant[] = []
    const fileOutputs: FileOutput[] = []

    await visitNode(node, {
        text: async (n) => {
            if (n.error) errors.push(n.error)
            const value = n.resolved
            if (value != undefined) appendUser(value)
        },
        def: async (n) => {
            if (n.error) errors.push(n.error)
            const value = n.resolved
            if (value !== undefined) appendUser(renderDefNode(n))
        },
        assistant: async (n) => {
            if (n.error) errors.push(n.error)
            const value = await n.resolved
            if (value != undefined) appendAssistant(value)
        },
        system: async (n) => {
            if (n.error) errors.push(n.error)
            const value = await n.resolved
            if (value != undefined) appendSystem(value)
        },
        stringTemplate: async (n) => {
            if (n.error) errors.push(n.error)
            const value = n.resolved
            if (value != undefined) appendUser(value)
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
\`\`\``
            appendUser(text)
            n.tokens = estimateTokens(text, encoder)
            if (trace && format !== "json")
                trace.detailsFenced(
                    `🧬 schema ${schemaName} as ${format}`,
                    schemaText,
                    format
                )
        },
        tool: (n) => {
            const { name, description, parameters, impl: fn, options } = n
            tools.push({
                spec: {
                    name,
                    description,
                    parameters,
                },
                impl: fn,
                options,
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

    const fods = fileOutputs?.filter((f) => !!f.description)
    if (fods?.length > 0) {
        appendSystem(`
## File generation rules

When generating files, use the following rules which are formatted as "file glob: description":

${fods.map((fo) => `   ${fo.pattern}: ${fo.description}`)}
`)
    }

    const res = Object.freeze<PromptNodeRender>({
        images,
        schemas,
        functions: tools,
        fileMerges,
        outputProcessors,
        chatParticipants,
        errors,
        messages,
        fileOutputs,
    })
    return res
}
