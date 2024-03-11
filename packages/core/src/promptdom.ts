import { stringifySchemaToTypeScript } from "./schema"
import { estimateTokens } from "./tokens"
import { MarkdownTrace } from "./trace"
import { assert, trimNewlines } from "./util"
import { YAMLStringify } from "./yaml"

export interface PromptNode {
    type?: "text" | "image" | "schema" | "function" | "fileMerge" | undefined
    children?: PromptNode[]
    priority?: number
    error?: unknown
}

export interface PromptTextNode extends PromptNode {
    type: "text"
    value: string | Promise<string>
}

export interface PromptImage {
    url: string
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
}> {
    const { trace } = options || {}

    if (trace) await tracePromptNode(model, node, trace)

    let prompt = ""
    const images: PromptImage[] = []
    const errors: unknown[] = []
    const schemas: Record<string, JSONSchema> = {}
    const functions: ChatFunctionCallback[] = []
    const fileMerges: FileMergeHandler[] = []
    await visitNode(node, {
        text: async (n) => {
            try {
                const value = await n.value
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
                    trace?.image(v.url, v.detail)
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
            prompt += `${schemaName}:
\`\`\`${format + "-schema"}
${trimNewlines(schemaText)}
\`\`\`
`
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
    })
    return { prompt, images, errors, schemas, functions, fileMerges }
}

export async function tracePromptNode(
    model: string,
    root: PromptNode,
    trace: MarkdownTrace
) {
    await visitNode(root, {
        node: (n) =>
            n === root
                ? trace.startDetails(`prompt tree: model ${model}`)
                : undefined,
        afterNode: (n) =>
            n.type !== "fileMerge" ? trace.endDetails() : undefined,
        text: async (n) => {
            const text = await n.value
            trace.startDetails(
                `<em>${text.slice(0, 20)}</em>... ${estimateTokens(model, text)}T`
            )
            trace.fence(text)
        },
        image: async (n) => {
            const img = await n.value
            trace.startDetails(`image: ${img.url}`)
            trace.image(img.url, img.detail)
        },
        function: (n) => {
            const { name, description, parameters } = n
            trace.startDetails(`function: ${name}`)
            trace.fence({ description, parameters }, "yaml")
        },
        schema: (n) => {
            trace.startDetails(`schema: ${n.name}`)
            trace.fence(n.value, "yaml")
        },
        fileMerge: (n) => {
            trace.item(`name: ${n.fn.name || ""}`)
        },
    })
}
