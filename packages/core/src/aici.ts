import { PromptNode, visitNode } from "./promptdom"
import { MarkdownTrace } from "./trace"
import { assert } from "./util"

export class NotSupportedError extends Error {
    constructor(message: string, options?: ErrorOptions) {
        super(message)
        this.name = "NotSupportedError"
    }
}

function javascriptStringEscape(s: string) {
    assert(typeof s === "string")
    return JSON.stringify(s).slice(1, -1)
}

function renderAICINode(node: AICINode) {
    const { type, name } = node
    switch (name) {
        case "gen":
            return `await gen(${JSON.stringify((node as AiciGenNode).options)})`
        default:
            return "undefined"
    }
}

export async function renderAICI(
    root: PromptNode,
    options?: { trace: MarkdownTrace }
): Promise<{ source?: string; controller?: "jsctrl"; error?: unknown }> {
    const { trace } = options
    const notSupported = (reason: string) => (n: any) => {
        throw new NotSupportedError(reason)
    }

    try {
        trace?.startDetails("aici")
        trace?.itemValue("controller", "jsctrl")
        let program: string[] = []
        let indent: string = ""
        const push = (text: string) => program.push(indent + text)

        push("async main() {")
        indent = "  "
        await visitNode(root, {
            text: async (n) => {
                const value = await n.value
                if (value !== undefined)
                    push(`await fixed(${JSON.stringify(value)})`)
            },
            stringTemplate: async (n) => {
                const { strings, args } = n
                let r = "await $`"
                for (let i = 0; i < strings.length; ++i) {
                    r += javascriptStringEscape(strings[i])
                    if (i < args.length) {
                        const arg = await args[i]
                        if (typeof arg === "string") {
                            r += javascriptStringEscape(arg)
                        } else if (arg.type === "aici") {
                            const rarg = renderAICINode(arg)
                            r += "${" + rarg + "}"
                        } else {
                            const rarg = JSON.stringify(arg)
                            r += "${" + rarg + "}"
                        }
                    }
                }
                r += "`"
                push(r)
            },
            image: notSupported("image"),
            function: notSupported("function"),
            // TODO?
            schema: notSupported("schema"),
            // ignore
            // outputProcessor,
            // fileMerge,
        })

        indent = ""
        push("}")
        push("start(main)")

        const source = program.join("\n")

        trace?.fence(source, "javascript")

        return { source, controller: "jsctrl" }
    } catch (error) {
        trace?.error("AICI code generation error", error)
        return { error }
    } finally {
        trace?.endDetails()
    }
}
