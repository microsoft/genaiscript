import { ChatCompletionMessageParam } from "./chattypes"
import { splitMarkdown } from "./frontmatter"
import { YAMLTryParse } from "./yaml"

export interface PromptyFrontmatter {
    name?: string
    description?: string
    version?: string
    authors?: string[]
    tags?: string[]
    sample?: Record<string, any>
}

export function promptyParse(text: string): {
    frontmatter: PromptyFrontmatter
    content: string
    messages: ChatCompletionMessageParam[]
} {
    const { frontmatter = "", content = "" } = splitMarkdown(text)
    const fm = YAMLTryParse(frontmatter) ?? {}
    // todo: validate frontmatter?
    const messages: ChatCompletionMessageParam[] = []

    // split
    const rx = /^\s*(system|user|assistant)\s*:\s*$/gim
    const lines = content.split(/\r?\n/g)
    let role: "system" | "user" | "assistant" | undefined = "system"
    let chunk: string[] = []

    const pushMessage = () => {
        if (role && chunk.length && chunk.some((l) => !!l)) {
            messages.push({
                role,
                content: chunk.join("\n"),
            })
        }
    }

    for (const line of lines) {
        const m = rx.exec(line)
        if (m) {
            // next role starts
            pushMessage()
            role = m[1] as "system" | "user" | "assistant"
            chunk = []
        } else {
            chunk.push(line)
        }
    }
    pushMessage()
    return { frontmatter: fm, content, messages }
}
