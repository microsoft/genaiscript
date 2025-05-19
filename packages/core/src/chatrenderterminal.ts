import {
    ChatCompletionAssistantMessageParam,
    ChatCompletionMessageParam,
    ChatCompletionMessageToolCall,
    ChatCompletionSystemMessageParam,
    ChatCompletionTool,
    ChatCompletionToolMessageParam,
    ChatCompletionUserMessageParam,
    CreateChatCompletionRequest,
} from "./chattypes"
import { renderImageToTerminal } from "./image"
import { terminalSize } from "./terminal"
import { ellipse } from "./util"
import { YAMLStringify } from "./yaml"
import { dataUriToBuffer } from "./file"
import { wrapColor } from "./consolecolor"
import {
    BOX_DOWN_AND_RIGHT,
    BOX_DOWN_UP_AND_RIGHT,
    BOX_RIGHT,
    BOX_UP_AND_DOWN,
    BOX_UP_AND_RIGHT,
    CHAR_ENVELOPE,
    CONSOLE_COLOR_DEBUG,
    CONTROL_CHAT_COLLAPSED,
    CONTROL_CHAT_EXPANDED,
    CONTROL_CHAT_LAST,
} from "./constants"
import { CancellationOptions, checkCancelled } from "./cancellation"
import { prettyTemperature, prettyTokens } from "./pretty"
import { genaiscriptDebug } from "./debug"
import { JSONSchemaToFunctionParameters } from "./schema"
const dbg = genaiscriptDebug("chat:render")

function renderTrimmed(s: string, rows: number, width: number) {
    const lines = s.split(/\n/g).filter((l) => !!l)
    let trimmed = lines.slice(0)
    if (lines.length > rows) {
        const head = Math.min(rows >> 1, lines.length - 1)
        const tail = rows - head
        trimmed = lines.slice(0, head)
        if (tail) {
            const hidden = lines.length - head - tail
            if (hidden === 1) trimmed.push(lines.at(-tail - 1))
            else if (hidden > 0) trimmed.push(`... (${hidden} lines)`)
            trimmed.push(...lines.slice(-tail))
        }
    }
    const res = trimmed.map((l, i) =>
        wrapColor(
            CONSOLE_COLOR_DEBUG,
            BOX_UP_AND_DOWN + ellipse(l, width) + "\n"
        )
    )
    return res
}

async function renderMessageContent(
    modelId: string,
    msg:
        | string
        | ChatCompletionAssistantMessageParam
        | ChatCompletionSystemMessageParam
        | ChatCompletionUserMessageParam
        | ChatCompletionToolMessageParam,
    options: {
        columns: number
        rows: number
    } & CancellationOptions
): Promise<string[]> {
    const { columns, rows, cancellationToken } = options
    const content = typeof msg === "string" ? msg : msg.content
    const margin = 2
    const width = columns - margin

    const render = (s: string) => renderTrimmed(s, rows, width)

    // Return the content directly if it's a simple string.
    if (typeof content === "string") return render(content)
    // If the content is an array, process each element based on its type.
    else if (Array.isArray(content)) {
        const res: string[] = []
        for (const c of content) {
            checkCancelled(cancellationToken)
            switch (c.type) {
                case "text":
                    res.push(...render(c.text))
                    break
                case "image_url":
                    res.push(
                        await renderImageToTerminal(
                            dataUriToBuffer(c.image_url.url),
                            { columns, rows, cancellationToken, modelId }
                        )
                    )
                    break
                case "input_audio":
                    res.push(...render(`🔊 audio`))
                    break
                case "refusal":
                    res.push(...render(`🚫 ` + c.refusal))
                    break
                default:
                    res.push(...render(`unknown`))
            }
        }
        return res
    } else return []
}

function renderToolCall(
    call: ChatCompletionMessageToolCall,
    options: { columns: number }
): string {
    const { columns } = options
    const width = columns - 2
    return wrapColor(
        CONSOLE_COLOR_DEBUG,
        ellipse(
            `${BOX_DOWN_UP_AND_RIGHT}${BOX_RIGHT}${BOX_RIGHT}📠 tool ${call.function.name} (${call.id})`,
            columns - 2
        ) +
            `\n` +
            (call.function.arguments
                ? wrapColor(
                      CONSOLE_COLOR_DEBUG,
                      `${BOX_UP_AND_DOWN} ${ellipse(call.function.arguments, width)}\n`
                  )
                : "")
    )
}

function renderMetadata(call: CreateChatCompletionRequest) {
    const { metadata } = call
    if (!metadata) return ""
    return wrapColor(
        CONSOLE_COLOR_DEBUG,
        `${BOX_DOWN_UP_AND_RIGHT}${BOX_RIGHT}📊 ${Object.entries(metadata)
            .map(([k, v]) => `${k}: ${v}`)
            .join(", ")}\n`
    )
}

/**
 * Renders a list of chat messages to an interactive terminal output.
 *
 * @param messages - The list of chat messages to render. Each message consists of role-specific content and attributes.
 * @param options - Configuration options for rendering:
 *   - system: Controls whether system messages are included. Defaults to true unless explicitly set to false.
 *   - user: Controls whether user messages are included. Defaults to true unless explicitly set to false.
 *   - assistant: Controls whether assistant messages are included. Defaults to true.
 *   - tools: Optional list of tools to be displayed, each containing metadata such as function names.
 *
 * @returns The formatted string output for terminal rendering.
 */
export async function renderMessagesToTerminal(
    request: CreateChatCompletionRequest,
    options?: {
        system?: boolean
        user?: boolean
        assistant?: boolean
        tools?: ChatCompletionTool[]
    }
) {
    const { model, temperature, metadata, response_format } = request
    let messages = request.messages.slice(0)
    const {
        system = undefined, // Include system messages unless explicitly set to false.
        user = undefined, // Include user messages unless explicitly set to false.
        assistant = true, // Include assistant messages by default.
        tools,
    } = options || {}

    const { columns } = terminalSize()
    dbg(`render %O`, messages)

    const msgRows = (msg: ChatCompletionMessageParam, visibility: boolean) =>
        msg === messages.at(-1)
            ? CONTROL_CHAT_LAST
            : visibility === true
              ? CONTROL_CHAT_EXPANDED
              : CONTROL_CHAT_COLLAPSED

    messages = messages.filter((msg) => {
        // Filter messages based on their roles.
        switch (msg.role) {
            case "system":
                return system !== false
            case "user":
                return user !== false
            case "assistant":
                return assistant !== false
            default:
                return true
        }
    })
    const res: string[] = []
    if (model) {
        res.push(
            wrapColor(
                CONSOLE_COLOR_DEBUG,
                `${BOX_DOWN_AND_RIGHT}${BOX_RIGHT}💬 ${model} ${CHAR_ENVELOPE} ${messages.length} ${prettyTemperature(temperature)}\n`
            )
        )
    }
    if (response_format) {
        const { type } = response_format
        res.push(
            wrapColor(
                CONSOLE_COLOR_DEBUG,
                `${BOX_DOWN_UP_AND_RIGHT}${BOX_RIGHT}📦 ${type}\n`
            )
        )
        if (type === "json_schema") {
            const { json_schema } = response_format
            res.push(
                wrapColor(
                    CONSOLE_COLOR_DEBUG,
                    `${BOX_UP_AND_DOWN} ${JSONSchemaToFunctionParameters(json_schema.schema as any)}\n`
                )
            )
        }
    }
    if (tools?.length) {
        res.push(
            wrapColor(
                CONSOLE_COLOR_DEBUG,
                `${BOX_DOWN_UP_AND_RIGHT}${BOX_RIGHT}🔧 tools (${tools.length})\n`
            ),
            wrapColor(
                CONSOLE_COLOR_DEBUG,
                `${BOX_UP_AND_DOWN} ${tools.map((tool) => tool.function.name).join(", ")}`
            ),
            "\n"
        )
    }

    if (metadata) res.push(renderMetadata(request))

    for (const msg of messages) {
        const { role } = msg
        switch (role) {
            case "system":
                res.push(
                    wrapColor(
                        CONSOLE_COLOR_DEBUG,
                        `${BOX_DOWN_AND_RIGHT}${BOX_RIGHT}📙 system\n`
                    ),
                    ...(await renderMessageContent(model, msg, {
                        columns,
                        rows: msgRows(msg, system),
                    }))
                )
                break
            case "user":
                res.push(
                    wrapColor(
                        CONSOLE_COLOR_DEBUG,
                        `${BOX_DOWN_AND_RIGHT}${BOX_RIGHT}👤 user\n`
                    )
                )
                res.push(
                    ...(await renderMessageContent(model, msg, {
                        columns,
                        rows: msgRows(msg, user),
                    }))
                )
                break
            case "assistant":
                res.push(
                    wrapColor(
                        CONSOLE_COLOR_DEBUG,
                        `${BOX_DOWN_AND_RIGHT}${BOX_RIGHT}🤖 assistant ${msg.name ? msg.name : ""}\n`
                    )
                )
                if (msg.reasoning_content)
                    res.push(
                        wrapColor(
                            CONSOLE_COLOR_DEBUG,
                            `${BOX_UP_AND_DOWN}${BOX_RIGHT}🤔 reasoning\n`
                        ),
                        msg.reasoning_content,
                        "\n"
                    )
                res.push(
                    ...(await renderMessageContent(model, msg, {
                        columns,
                        rows: msgRows(msg, assistant),
                    }))
                )
                if (msg.tool_calls?.length)
                    res.push(
                        ...msg.tool_calls.map((call) =>
                            renderToolCall(call, { columns })
                        )
                    )
                break
            case "tool":
                res.push(
                    wrapColor(
                        CONSOLE_COLOR_DEBUG,
                        `${BOX_DOWN_AND_RIGHT}${BOX_RIGHT}🔧 tool ${msg.tool_call_id || ""}\n`
                    ),
                    ...(await renderMessageContent(model, msg, {
                        columns,
                        rows: msgRows(msg, undefined),
                    }))
                )
                break
            default:
                res.push(
                    wrapColor(
                        CONSOLE_COLOR_DEBUG,
                        `${BOX_DOWN_AND_RIGHT}${BOX_RIGHT}${role}\n`
                    ),
                    ...(await renderMessageContent(model, YAMLStringify(msg), {
                        columns,
                        rows: msgRows(msg, undefined),
                    }))
                )
                break
        }
    }
    // Join the result array into a single markdown string.
    return res.filter((s) => s !== undefined).join("")
}
