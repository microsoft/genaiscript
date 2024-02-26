import { assert } from "./util"

export interface PromptNode {
    value?: string | Promise<string>
    children?: PromptNode[]
    priority?: number
}

export function createTextNode(value: string | Promise<string>): PromptNode {
    assert(value !== undefined)
    return { value }
}

export function appendChild(parent: PromptNode, child: PromptNode): void {
    if (!parent.children) {
        parent.children = []
    }
    parent.children.push(child)
}

export function appendTextChild(
    parent: PromptNode,
    text: string | Promise<string>
): void {
    appendChild(parent, createTextNode(text))
}

export async function visitNode(
    node: PromptNode,
    visitor: (node: PromptNode) => Promise<void>
) {
    await visitor(node)
    if (node.children) {
        for (const child of node.children) {
            await visitNode(child, visitor)
        }
    }
}

export async function renderNode(node: PromptNode) {
    let output = ""
    await visitNode(node, async (n) => {
        const value = await n.value
        if (value != undefined)
            output += value + "\n"
    })
    return output
}
