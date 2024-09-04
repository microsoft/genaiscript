import { ChatCompletionMessageParam } from "./chattypes"
import { splitMarkdown } from "./frontmatter"
import { YAMLTryParse } from "./yaml"
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

    // unofficial
    files?: string | string[]
    tests?: PromptTest | PromptTest[]
}

export interface PromptyDocument {
    meta: PromptArgs
    frontmatter: PromptyFrontmatter
    content: string
    messages: ChatCompletionMessageParam[]
}

function promptyFrontmatterToMeta(frontmatter: PromptyFrontmatter): PromptArgs {
    const {
        name,
        description,
        tags,
        sample,
        inputs,
        outputs,
        model,
        files,
        tests,
    } = frontmatter
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
        files,
        tests,
        tags,
        parameters,
        responseType: outputs
            ? "json_object"
            : modelParameters?.response_format,
        responseSchema: outputs,
        temperature: modelParameters?.temperature,
        maxTokens: modelParameters?.max_tokens,
        topP: modelParameters?.top_p,
    })
    return meta
}

export function promptyParse(text: string): PromptyDocument {
    const { frontmatter = "", content = "" } = splitMarkdown(text)
    const fm = YAMLTryParse(frontmatter) ?? {}
    const meta = promptyFrontmatterToMeta(fm)
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
    return { meta, frontmatter: fm, content, messages }
}

export function promptyToGenAIScript(doc: PromptyDocument) {
    const { messages, meta } = doc

    let src = ``
    if (Object.keys(meta).length) {
        src += `script(${JSON5Stringify(meta, null, 2)})\n\n`
    }
    src += messages
        .map((msg) => {
            const { role, content } = msg
            if (role === "assistant") {
                return `writeText(${JSON.stringify(formatContent(content as string))}, { assistant: true })`
            } else {
                return `$\`${formatContent(content as string).replace(/`/g, "\\`")}\``
            }
        })
        .join("\n")

    return src

    function formatContent(content: string) {
        const text = content
            .replace(
                /\{\{([^\}]+)\}\}/g,
                (__, name) => "${env.vars." + name + "}"
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
                            .replace(/\$\{([a-z0-9.]+)\}/gi, (_, v: string) =>
                                v.startsWith(varname)
                                    ? "${" + v.slice("env.vars.".length) + "}"
                                    : _
                            ) +
                        "`).join('')}"
                    )
                }
            )
        return text
    }
}
