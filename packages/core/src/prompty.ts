import { ChatCompletionMessageParam } from "./chattypes"
import { splitMarkdown } from "./frontmatter"
import { YAMLTryParse } from "./yaml"
import { dedent } from "./indent"
import { deleteUndefinedValues } from "./util"
import { JSON5Stringify } from "./json5"

export interface PromptyFrontmatter {
    name?: string
    description?: string
    version?: string
    authors?: string[]
    tags?: string[]
    sample?: Record<string, any> | string
    inputs?: Record<
        string,
        | JSONSchemaNumber
        | JSONSchemaBoolean
        | JSONSchemaString
        | JSONSchemaObject
    >
    outputs?: JSONSchemaObject
}

export interface PromptyDocument {
    frontmatter: PromptyFrontmatter
    content: string
    messages: ChatCompletionMessageParam[]
}

export function promptyParse(text: string): PromptyDocument {
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
                content: chunk.join("\n").trim(),
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

export function promptyToGenAIScript(doc: PromptyDocument) {
    const { frontmatter, messages } = doc
    const { name, description, tags, sample, inputs, outputs } = frontmatter
    const parameters = inputs ? structuredClone(inputs) : undefined
    if (parameters && sample && typeof sample === "object")
        for (const p in sample) {
            const s = sample[p]
            if (s !== undefined && parameters[p].type !== "object")
                parameters[p].default = s
        }
    const meta = deleteUndefinedValues(<PromptArgs>{
        title: name,
        description,
        tags,
        parameters,
        responseType: outputs ? "json_object" : undefined,
        responseSchema: outputs,
    })

    let src = ``
    if (Object.keys(meta).length) {
        src += `script(${JSON5Stringify(meta, null, 2)})\n\n`
    }
    src += messages
        .map((m) => {
            const text = String(m.content).replace(
                /\{\{([^\}]+)\}\}/g,
                (m, name) => "${env.vars." + name + "}"
            )
            return `$\`${text}\``
        })
        .join("\n")

    return src
}
