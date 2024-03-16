import { stringifySchemaToTypeScript } from "./schema"
import { estimateTokens } from "./tokens"
import { MarkdownTrace } from "./trace"
import { assert, trimNewlines } from "./util"
import { YAMLStringify } from "./yaml"

export interface PromptNode {
    type?:
        | "text"
        | "image"
        | "schema"
        | "function"
        | "fileMerge"
        | "outputProcessor"
        | undefined
    children?: PromptNode[]
    priority?: number
    error?: unknown
    tokens?: number
}

export interface PromptTextNode extends PromptNode {
    type: "text"
    value: string | Promise<string>
}

export interface PromptImage {
    url: string
    filename?: string
    detail?: "low" | "high"
}

export interface PromptImageNode extends PromptNode {
    type: "image"
    value: PromptImage | Promise<PromptImage>
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
    parameters: ChatFunctionParameters
    fn: ChatFunctionHandler
}

export interface PromptFileMergeNode extends PromptNode {
    type: "fileMerge"
    fn: FileMergeHandler
}

export interface PromptOutputProcessorNode extends PromptNode {
    type: "outputProcessor"
    fn: OutputProcessorHandler
}

export function createTextNode(
    value: string | Promise<string>
): PromptTextNode {
    assert(value !== undefined)
    return { type: "text", value }
}

export function createImageNode(
    value: PromptImage | Promise<PromptImage>
): PromptImageNode {
    assert(value !== undefined)
    return { type: "image", value }
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

export function createFunctioNode(
    name: string,
    description: string,
    parameters: ChatFunctionParameters,
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
    fn: OutputProcessorHandler
): PromptOutputProcessorNode {
    assert(fn !== undefined)
    return { type: "outputProcessor", fn }
}

export function appendChild(parent: PromptNode, child: PromptNode): void {
    if (!parent.children) {
        parent.children = []
    }
    parent.children.push(child)
}

export async function visitNode(
    node: PromptNode,
    visitor: {
        node?: (node: PromptNode) => void | Promise<void>
        afterNode?: (node: PromptNode) => void | Promise<void>
        text?: (node: PromptTextNode) => void | Promise<void>
        image?: (node: PromptImageNode) => void | Promise<void>
        schema?: (node: PromptSchemaNode) => void | Promise<void>
        function?: (node: PromptFunctionNode) => void | Promise<void>
        fileMerge?: (node: PromptFileMergeNode) => void | Promise<void>
        outputProcessor?: (
            node: PromptOutputProcessorNode
        ) => void | Promise<void>
    }
) {
    await visitor.node?.(node)
    switch (node.type) {
        case "text":
            await visitor.text?.(node as PromptTextNode)
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
    }
    if (node.children) {
        for (const child of node.children) {
            await visitNode(child, visitor)
        }
    }
    await visitor.afterNode?.(node)
}

export async function renderPromptNode(
    model: string,
    node: PromptNode,
    options?: { trace: MarkdownTrace }
): Promise<{
    prompt: string
    images: PromptImage[]
    errors: unknown[]
    schemas: Record<string, JSONSchema>
    functions: ChatFunctionCallback[]
    fileMerges: FileMergeHandler[]
    outputProcessors: OutputProcessorHandler[]
}> {
    const { trace } = options || {}

    let prompt = ""
    const images: PromptImage[] = []
    const errors: unknown[] = []
    const schemas: Record<string, JSONSchema> = {}
    const functions: ChatFunctionCallback[] = []
    const fileMerges: FileMergeHandler[] = []
    const outputProcessors: OutputProcessorHandler[] = []
    await visitNode(node, {
        text: async (n) => {
            try {
                const value = await n.value
                n.tokens = estimateTokens(model, value)
                if (value != undefined) prompt += value + "\n"
            } catch (e) {
                node.error = e
                errors.push(e)
            }
        },
        image: async (n) => {
            try {
                const v = await n.value
                if (v !== undefined) {
                    images.push(v)
                    if (trace) {
                        trace.startDetails(
                            `🖼 image: ${v.detail || ""} ${v.filename || v.url.slice(0, 64) + "..."}`
                        )
                        trace.image(v.url, v.filename)
                        trace.endDetails()
                    }
                }
            } catch (e) {
                node.error = e
                errors.push(e)
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
                    schemaText = stringifySchemaToTypeScript(schema, {
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
            n.tokens = estimateTokens(model, text)
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
                `🛠️ function ${name}`,
                { description, parameters },
                "yaml"
            )
        },
        fileMerge: (n) => {
            fileMerges.push(n.fn)
            trace.item(`file merge: ${n.fn.name || ""}`)
        },
        outputProcessor: (n) => {
            outputProcessors.push(n.fn)
            trace.item(`output processor: ${n.fn.name || ""}`)
        },
    })
    return {
        prompt,
        images,
        errors,
        schemas,
        functions,
        fileMerges,
        outputProcessors,
    }
}
