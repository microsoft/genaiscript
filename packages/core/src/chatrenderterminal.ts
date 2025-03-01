import {
    ChatCompletionAssistantMessageParam,
    ChatCompletionMessageParam,
    ChatCompletionMessageToolCall,
    ChatCompletionSystemMessageParam,
    ChatCompletionToolMessageParam,
    ChatCompletionUserMessageParam,
} from "./chattypes"
import { renderImageToTerminal } from "./image"
import { terminalSize } from "./terminal"
import { ellipse, ellipseLast } from "./util"
import { YAMLStringify } from "./yaml"
import { dataUriToBuffer } from "./file"
import { wrapColor } from "./consolecolor"
import {
    CONSOLE_COLOR_DEBUG,
    CONTROL_CHAT_COLLAPSED,
    CONTROL_CHAT_EXPANDED,
} from "./constants"

async function renderMessageContent(
    msg:
        | string
        | ChatCompletionAssistantMessageParam
        | ChatCompletionSystemMessageParam
        | ChatCompletionUserMessageParam
        | ChatCompletionToolMessageParam,
    options: {
        columns: number
        rows: number
    }
): Promise<string[]> {
    const { columns, rows } = options
    const content = typeof msg === "string" ? msg : msg.content
    const margin = 2
    const width = columns - margin

    const render = (s: string) => {
        const lines = s.split(/\n/g).filter((l) => !!l)
        const trimmed = lines.slice(-rows)
        const res = trimmed.map((l) =>
            wrapColor(CONSOLE_COLOR_DEBUG, "│" + ellipse(l, width) + "\n")
        )
        if (lines.length > trimmed.length)
            res.unshift(wrapColor(CONSOLE_COLOR_DEBUG, "│...\n"))
        return res
    }

    // Return the content directly if it's a simple string.
    if (typeof content === "string") return render(content)
    // If the content is an array, process each element based on its type.
    else if (Array.isArray(content)) {
        const res: string[] = []
        for (const c of content) {
            switch (c.type) {
                case "text":
                    res.push(...render(c.text))
                    break
                case "image_url":
                    res.push(
                        await renderImageToTerminal(
                            dataUriToBuffer(c.image_url.url),
                            { columns, rows }
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
        ellipse(`├──📠 tool ${call.function.name}`, columns - 2) +
            `\n` +
            (call.function.arguments
                ? wrapColor(
                      CONSOLE_COLOR_DEBUG,
                      "│" + ellipse(call.function.arguments, width) + "\n"
                  )
                : "")
    )
}

export async function renderMessagesToTerminal(
    messages: ChatCompletionMessageParam[],
    options?: {
        system?: boolean
        user?: boolean
        assistant?: boolean
    }
) {
    const {
        system = undefined, // Include system messages unless explicitly set to false.
        user = undefined, // Include user messages unless explicitly set to false.
        assistant = true, // Include assistant messages by default.
    } = options || {}

    const { columns } = terminalSize()

    const msgRows = (msg: ChatCompletionMessageParam, visibility: boolean) =>
        msg === messages.at(-1) || visibility === true
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
    for (const msg of messages) {
        const { role } = msg
        switch (role) {
            case "system":
                res.push(
                    wrapColor(CONSOLE_COLOR_DEBUG, "┌─📙 system\n"),
                    ...(await renderMessageContent(msg, {
                        columns,
                        rows: msgRows(msg, system),
                    }))
                )
                break
            case "user":
                res.push(wrapColor(CONSOLE_COLOR_DEBUG, "┌─👤 user\n"))
                res.push(
                    ...(await renderMessageContent(msg, {
                        columns,
                        rows: msgRows(msg, user),
                    }))
                )
                break
            case "assistant":
                res.push(
                    wrapColor(
                        CONSOLE_COLOR_DEBUG,
                        `┌─🤖 assistant ${msg.name ? msg.name : ""}\n`
                    )
                )
                if (msg.reasoning_content)
                    res.push(
                        wrapColor(CONSOLE_COLOR_DEBUG, "├──🤔 reasoning\n"),
                        msg.reasoning_content,
                        "\n"
                    )
                res.push(
                    ...(await renderMessageContent(msg, {
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
                        `┌─🔧 tool ${msg.tool_call_id || ""}\n`
                    ),
                    ...(await renderMessageContent(msg, {
                        columns,
                        rows: msgRows(msg, undefined),
                    }))
                )
                break
            default:
                res.push(
                    wrapColor(CONSOLE_COLOR_DEBUG, "┌─" + role + "\n"),
                    ...(await renderMessageContent(YAMLStringify(msg), {
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
