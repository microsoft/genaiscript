import { assert } from "./util"

export interface PromptNode {
    type?: "text" | "image" | undefined
    children?: PromptNode[]
    priority?: number
}

export interface PromptTextNode extends PromptNode {
    type: "text"
    value: string | Promise<string>
}

export interface PromptImage {
    url: string
    details?: "low" | "high"
}

export interface PromptImageNode extends PromptNode {
    type: "image"
    value: PromptImage | Promise<PromptImage>
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

export function appendChild(parent: PromptNode, child: PromptNode): void {
    if (!parent.children) {
        parent.children = []
    }
    parent.children.push(child)
}

export async function visitNode(
    node: PromptNode,
    visitor: {
        node?: (node: PromptNode) => Promise<void>
        text?: (node: PromptTextNode) => Promise<void>
        image?: (node: PromptImageNode) => Promise<void>
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
    }
    if (node.children) {
        for (const child of node.children) {
            await visitNode(child, visitor)
        }
    }
}

export async function renderPromptNode(
    node: PromptNode
): Promise<{ prompt: string; images: PromptImage[] }> {
    let prompt = ""
    const images: PromptImage[] = []
    await visitNode(node, {
        text: async (n) => {
            const value = await n.value
            if (value != undefined) prompt += value + "\n"
        },
        image: async (n) => {
            const v = await n.value
            if (v !== undefined) images.push(v)
        },
    })
    return { prompt, images }
}
