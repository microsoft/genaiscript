// Import statements for various message parameters used in chat rendering.
import type {
    ChatCompletionAssistantMessageParam,
    ChatCompletionMessageParam,
    ChatCompletionSystemMessageParam,
    ChatCompletionTool,
    ChatCompletionToolMessageParam,
    ChatCompletionUserMessageParam,
} from "./chattypes"
import { collapseNewlines } from "./cleaners"

// Import utility functions for JSON5 parsing, markdown formatting, and YAML stringification.
import { JSONLLMTryParse } from "./json5"
import { details, fenceMD } from "./mkmd"
import { stringify as YAMLStringify } from "yaml"
import { CancellationOptions, checkCancelled } from "./cancellation"

export interface ChatRenderOptions extends CancellationOptions {
    textLang?: "markdown" | "text" | "json" | "raw"
    system?: boolean
    user?: boolean
    assistant?: boolean
    cacheImage?: (url: string) => Promise<string>
    tools?: ChatCompletionTool[]
}

/**
 * Renders the output of a shell command.
 * @param output - The shell output containing exit code, stdout, and stderr.
 * @returns A formatted string representing the shell output.
 */
export function renderShellOutput(output: ShellOutput) {
    // Destructure the output object to retrieve exitCode, stdout, and stderr.
    const { exitCode, stdout, stderr } = output
    if (exitCode === 0) return stdout
    return (
        [
            // Include exit code in the output only if it's non-zero.
            exitCode !== 0 ? `EXIT_CODE: ${exitCode}` : undefined,
            // Include stdout if it exists, formatted as text.
            stdout ? `STDOUT:${fenceMD(stdout, "text")}` : undefined,
            // Include stderr if it exists, formatted as text.
            stderr ? `STDERR:${fenceMD(stderr, "text")}` : undefined,
        ]
            // Filter out undefined values from the array.
            .filter((s) => s)
            // Join the elements with two newlines for separation.
            .join("\n\n")
    )
}

/**
 * Renders message content to a string.
 * @param msg - The message which could be of various types.
 * @returns A string representing the message content or undefined.
 */
export async function renderMessageContent(
    msg:
        | ChatCompletionAssistantMessageParam
        | ChatCompletionSystemMessageParam
        | ChatCompletionUserMessageParam
        | ChatCompletionToolMessageParam,
    options?: ChatRenderOptions
): Promise<string | undefined> {
    const { cacheImage, textLang } = options || {}
    const content = msg.content

    // Return the content directly if it's a simple string.
    if (typeof content === "string") {
        if (textLang === "raw") return content
        else return fenceMD(content, textLang)
    }
    // If the content is an array, process each element based on its type.
    else if (Array.isArray(content)) {
        const res: string[] = []
        for (const c of content) {
            switch (c.type) {
                case "text":
                    if (textLang === "raw") res.push(c.text)
                    else res.push(fenceMD(c.text, textLang))
                    break
                case "image_url":
                    res.push(
                        `\n\n![image](${(await cacheImage?.(c.image_url.url)) || c.image_url.url})\n\n`
                    )
                    break
                case "input_audio":
                    res.push(`🔊 [audio](${c.input_audio})`)
                    break
                case "refusal":
                    res.push(`refused: ${c.refusal}`)
                    break
                default:
                    res.push(`unknown message`)
            }
        }
        return res.join(" ")
    }
    // Return undefined if the content is neither a string nor an array.
    return undefined
}

/**
 * Retrieves the reasoning content from the last assistant message in the chat.
 * Checks if the last message has the role of 'assistant' and contains reasoning content.
 * 
 * @param messages - An array of chat messages.
 * @returns A boolean indicating whether the last message is from the assistant and has reasoning content.
 */
export function lastAssistantReasoning(messages: ChatCompletionMessageParam[]) {
    const last = messages.at(-1)
    return last?.role === "assistant" && last.reasoning_content
}

/**
 * Converts a list of chat messages to a markdown string.
 * @param messages - Array of chat messages.
 * @param options - Optional filtering options for different roles.
 * @returns A formatted markdown string of the chat messages.
 */
export async function renderMessagesToMarkdown(
    messages: ChatCompletionMessageParam[],
    options?: ChatRenderOptions
) {
    // Set default options for filtering message roles.
    const {
        textLang = "markdown",
        system = undefined, // Include system messages unless explicitly set to false.
        user = undefined, // Include user messages unless explicitly set to false.
        assistant = true, // Include assistant messages by default.
        cancellationToken,
        tools,
    } = options || {}
    options = {
        textLang,
        system,
        user,
        assistant,
        cancellationToken,
        tools,
    }
    const optionsMarkdown: ChatRenderOptions = {
        textLang: "markdown",
        system,
        user,
        assistant,
        cancellationToken,
        tools,
    }

    const res: string[] = []

    if (tools?.length) {
        res.push(
            details(
                `🔧 tools (${tools.length})`,
                tools
                    .map(
                        (tool) =>
                            `-  \`${tool.function.name}\`: ${tool.function.description || ""}`
                    )
                    .join("\n")
            )
        )
    }

    for (const msg of messages?.filter((msg) => {
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
    })) {
        checkCancelled(cancellationToken)
        const { role } = msg
        switch (role) {
            case "system":
                res.push(
                    details(
                        "📙 system",
                        await renderMessageContent(msg, optionsMarkdown),
                        false
                    )
                )
                break
            case "user":
                res.push(
                    details(
                        `👤 user`,
                        await renderMessageContent(msg, options),
                        user === true
                    )
                )
                break
            case "assistant":
                res.push(
                    details(
                        `🤖 assistant ${msg.name ? msg.name : ""}`,
                        [
                            msg.reasoning_content
                                ? details(
                                      "🤔 reasoning",
                                      fenceMD(msg.reasoning_content, "markdown")
                                  )
                                : undefined,
                            await renderMessageContent(msg, optionsMarkdown),
                            ...(msg.tool_calls?.map((tc) =>
                                details(
                                    `📠 tool call <code>${tc.function.name}</code> (<code>${tc.id}</code>)`,
                                    renderToolArguments(tc.function.arguments)
                                )
                            ) || []),
                        ]
                            .filter((s) => !!s)
                            .join("\n\n"),
                        assistant === true
                    )
                )
                break
            case "tool":
                res.push(
                    details(
                        `🛠️ tool output <code>${msg.tool_call_id}</code>`,
                        await renderMessageContent(msg, {
                            ...(options || {}),
                            textLang: "json",
                        })
                    )
                )
                break
            default:
                res.push(role, fenceMD(JSON.stringify(msg, null, 2), "json"))
                break
        }
    }
    // Join the result array into a single markdown string.
    return collapseNewlines(res.filter((s) => s !== undefined).join("\n"))
}

/**
 * Parses and renders tool arguments into formatted YAML or JSON.
 * @param args - The tool arguments as a string.
 * @returns A formatted string in YAML or JSON.
 */
function renderToolArguments(args: string) {
    const js = JSONLLMTryParse(args)
    // Convert arguments to YAML if possible, otherwise keep as JSON.
    if (js) return fenceMD(YAMLStringify(js), "yaml")
    else return fenceMD(args, "json")
}

/**
 * Collapses system messages at the beginning of the message array into a single message.
 * Removes empty text contents from user messages.
 *
 * This function identifies the first block of system messages and combines their contents 
 * into one cohesive message, replacing the individual messages in the array. It also 
 * filters out any empty text content found in user messages, ensuring only relevant 
 * information is retained.
 *
 * @param messages - An array of chat messages to be processed.
 */
export function collapseChatMessages(messages: ChatCompletionMessageParam[]) {
    // concat the content of system messages at the start of the messages into a single message
    const startSystem = messages.findIndex((m) => m.role === "system")
    if (startSystem > -1) {
        let endSystem =
            startSystem +
            messages
                .slice(startSystem)
                .findIndex((m) => m.role !== "system" || m.cacheControl)
        if (endSystem < 0) endSystem = messages.length
        if (endSystem > startSystem + 1) {
            const systemContent = messages
                .slice(startSystem, endSystem)
                .map((m) => m.content)
                .join("\n")
            messages.splice(startSystem, endSystem - startSystem, {
                role: "system",
                content: systemContent,
            })
        }
    }

    // remove emty text contents
    messages
        .filter((m) => m.role === "user")
        .forEach((m) => {
            if (typeof m.content !== "string")
                m.content = m.content.filter((c) => c.type !== "text" || c.text)
        })
}
