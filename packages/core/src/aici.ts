import { PromptNode, visitNode } from "./promptdom"
import { MarkdownTrace } from "./trace"
import { assert } from "./util"

export class NotSupportedError extends Error {
    constructor(message: string, options?: ErrorOptions) {
        super(message)
        this.name = "NotSupportedError"
    }
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

function escapeJavascriptString(s: string) {
    return s.replace(/`/g, "\\`")
}

export interface AICIRequest {
    role: "aici"
    content?: string
    controller?: "jsctrl"
    error?: unknown
}

export async function renderAICI(
    root: PromptNode,
    options?: { trace: MarkdownTrace }
): Promise<AICIRequest> {
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

        push("async function main() {")
        indent = "  "
        await visitNode(root, {
            text: async (n) => {
                const value = await n.value
                if (value !== undefined)
                    // TODO escape javascript string to `...`
                    push(`await fixed(\`${escapeJavascriptString(value)}\``)
            },
            stringTemplate: async (n) => {
                const { strings, args } = n
                let r = "await $`"
                for (let i = 0; i < strings.length; ++i) {
                    r += escapeJavascriptString(strings[i])
                    if (i < args.length) {
                        const arg = await args[i]
                        if (typeof arg === "string") {
                            r += escapeJavascriptString(arg)
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

        const content = program.join("\n")

        trace?.fence(content, "javascript")

        return { role: "aici", content, controller: "jsctrl" }
    } catch (error) {
        trace?.error("AICI code generation error", error)
        throw error
    } finally {
        trace?.endDetails()
    }
}
