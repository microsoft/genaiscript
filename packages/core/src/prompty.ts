import {
    ChatCompletionContentPart,
    ChatCompletionMessageParam,
} from "./chattypes"
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
            response_format?: { type: "json_object" }
            max_tokens?: number
            temperature?: number
            top_p?: number
            n?: number
            seed?: number
            stream?: boolean // ignored
            tools?: unknown[] // ignored
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
            const pp = parameters[p]
            if (s !== undefined && pp && pp?.type !== "object") pp.default = s
        }

    let modelName: string = undefined
    if (api !== "chat") throw new Error("completion api not supported")
    if (modelParameters?.n > 1) throw new Error("multi-turn not supported")
    if (modelParameters?.tools?.length)
        throw new Error("streaming not supported")

    // resolve model
    if (
        configuration?.type === "azure_openai" ||
        configuration?.type === "azure"
    ) {
        if (!configuration.azure_deployment)
            throw new Error("azure_deployment required")
        modelName = `azure:${configuration.azure_deployment}`
    } else if (configuration?.type === "azure_serverless") {
        modelName = `azure_serverless:${configuration.azure_endpoint}`
    } else if (configuration?.type === "openai")
        modelName = `openai:${configuration.type}`

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
            : modelParameters?.response_format?.type,
        responseSchema: outputs,
        temperature: modelParameters?.temperature,
        maxTokens: modelParameters?.max_tokens,
        topP: modelParameters?.top_p,
        seed: modelParameters?.seed,
    })
    return meta
}

export function promptyParse(text: string): PromptyDocument {
    const { frontmatter = "", content = "" } = splitMarkdown(text)
    const fm = YAMLTryParse(frontmatter) ?? {}
    const meta = fm ? promptyFrontmatterToMeta(fm) : {}
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

    const renderJinja = (content: string) =>
        `$\`${content.replace(/`/g, "\\`")}\`${/\{(%|\{)/.test(content) ? `.jinja(env.vars)` : ""}`
    const renderPart = (c: ChatCompletionContentPart) =>
        c.type === "text"
            ? renderJinja(c.text)
            : c.type === "image_url"
              ? `defImages("${c.image_url}")`
              : c.type === "input_audio"
                ? `defAudio("${c.input_audio}")`
                : `unknown message`

    let src = ``
    if (Object.keys(meta).length) {
        src += `script(${JSON5Stringify(meta, null, 2)})\n\n`
    }
    src += messages
        .map((msg) => {
            const { role, content } = msg
            if (role === "assistant") {
                return `assistant(parsers.jinja(${JSON.stringify(content as string)}, env.vars))`
            } else if (role === "system") {
                return `writeText(${JSON.stringify(content as string)}, { role: "system" })`
            } else {
                if (typeof content === "string") return renderJinja(content)
                else if (Array.isArray(content))
                    return content.map(renderPart).join("\n")
                else return renderPart(content)
            }
        })
        .join("\n")

    return src
}
