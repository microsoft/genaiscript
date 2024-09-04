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
    model?: {
        api?: "chat" | "completion"
        configuration?: {
            type?: string
            name?: string
            organization?: string
            api_version?: string
            azure_deployment: string
            azure_endpoint: string
        }
        parameters?: {
            response_format: "json_object"
            max_tokens?: number
            temperature?: number
            top_p?: number
        }
    }
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
    const { name, description, tags, sample, inputs, outputs, model } =
        frontmatter
    const {
        api = "chat",
        configuration,
        parameters: modelParameters,
    } = model ?? {}
    const parameters = inputs ? structuredClone(inputs) : undefined
    if (parameters && sample && typeof sample === "object")
        for (const p in sample) {
            const s = sample[p]
            if (s !== undefined && parameters[p].type !== "object")
                parameters[p].default = s
        }

    let modelName: string = undefined
    if (api !== "chat") throw new Error("completion api not supported")
    if (configuration?.azure_deployment)
        modelName = `azure:${configuration.azure_deployment}`
    else if (configuration?.type) modelName = `openai:${configuration.type}`

    const meta = deleteUndefinedValues(<PromptArgs>{
        model: modelName,
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
            const text = String(m.content)
                .replace(
                    /\{\{([^\}]+)\}\}/g,
                    (m, name) => "${env.vars." + name + "}"
                )
                .replace(
                    /\{%\s*for\s+(\w+)\s+in\s+([a-zA-Z0-9\.]+)\s*%\}((.|\n)+?){%\s+endfor\s+%\}/gi,
                    (_, item, col, temp: string) => {
                        const varname = "env.vars." + item
                        return (
                            "${env.vars." +
                            col +
                            ".map(" +
                            item +
                            " => \n`" +
                            temp
                                .replace(/^\r?\n/, "")
                                .replace(
                                    /\$\{([a-z0-9.]+)\}/gi,
                                    (_, v: string) =>
                                        v.startsWith(varname)
                                            ? "${" +
                                              v.slice("env.vars.".length) +
                                              "}"
                                            : _
                                ) +
                            "`).join('')}"
                        )
                    }
                )
            return `$\`${text}\``
        })
        .join("\n")

    return src
}
