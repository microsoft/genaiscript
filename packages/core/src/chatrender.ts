// Import statements for various message parameters used in chat rendering.
import type {
    ChatCompletionAssistantMessageParam,
    ChatCompletionMessageParam,
    ChatCompletionSystemMessageParam,
    ChatCompletionToolMessageParam,
    ChatCompletionUserMessageParam,
} from "./chattypes"

// Import utility functions for JSON5 parsing, markdown formatting, and YAML stringification.
import { JSONLLMTryParse } from "./json5"
import { details, fenceMD } from "./mkmd"
import { stringify as YAMLStringify } from "yaml"
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
export function renderMessageContent(
    msg:
        | ChatCompletionAssistantMessageParam
        | ChatCompletionSystemMessageParam
        | ChatCompletionUserMessageParam
        | ChatCompletionToolMessageParam
): string {
    const content = msg.content
    // Return the content directly if it's a simple string.
    if (typeof content === "string") return content
    // If the content is an array, process each element based on its type.
    else if (Array.isArray(content))
        return (
            content
                .map((c) =>
                    // Handle different types of content: text, refusal, and image.
                    c.type === "text"
                        ? c.text
                        : c.type === "image_url"
                          ? `![](${c.image_url})`
                          : c.type === "input_audio"
                            ? `🔊 [audio](${c.input_audio})`
                            : c.type === "refusal"
                              ? `refused: ${c.refusal}`
                              : `unknown message`
                )
                // Join the content array into a single string with spaces.
                .join(` `)
        )
    // Return undefined if the content is neither a string nor an array.
    return undefined
}

/**
 * Converts a list of chat messages to a markdown string.
 * @param messages - Array of chat messages.
 * @param options - Optional filtering options for different roles.
 * @returns A formatted markdown string of the chat messages.
 */
export function renderMessagesToMarkdown(
    messages: ChatCompletionMessageParam[],
    options?: {
        system?: boolean
        user?: boolean
        assistant?: boolean
    }
) {
    // Set default options for filtering message roles.
    const {
        system = undefined, // Include system messages unless explicitly set to false.
        user = undefined, // Include user messages unless explicitly set to false.
        assistant = true, // Include assistant messages by default.
    } = options || {}

    const res: string[] = []
    messages
        ?.filter((msg) => {
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
        ?.forEach((msg) => {
            const { role } = msg
            switch (role) {
                case "system":
                    res.push(
                        details(
                            "📙 system",
                            fenceMD(renderMessageContent(msg), "markdown"),
                            false
                        )
                    )
                    break
                case "user":
                    let content: string
                    if (typeof msg.content === "string")
                        content = fenceMD(msg.content, "markdown")
                    else if (Array.isArray(msg.content)) {
                        content = ""
                        for (const part of msg.content) {
                            if (part.type === "text")
                                content += fenceMD(part.text, "markdown")
                            else if (part.type === "image_url")
                                content += `\n![image](${part.image_url.url})`
                            else content += fenceMD(YAMLStringify(part), "yaml")
                        }
                    } else content = fenceMD(YAMLStringify(msg), "yaml")
                    res.push(details(`👤 user`, content, user === true))
                    break
                case "assistant":
                    res.push(
                        details(
                            `🤖 assistant ${msg.name ? msg.name : ""}`,
                            [
                                fenceMD(renderMessageContent(msg), "markdown"),
                                ...(msg.tool_calls?.map((tc) =>
                                    details(
                                        `📠 tool call <code>${tc.function.name}</code> (<code>${tc.id}</code>)`,
                                        renderToolArguments(
                                            tc.function.arguments
                                        )
                                    )
                                ) || []),
                            ]
                                .filter((s) => !!s)
                                .join("\n\n"),
                            assistant === true
                        )
                    )
                    break
                case "aici":
                    res.push(details(`AICI`, fenceMD(msg.content, "markdown")))
                    break
                case "tool":
                    res.push(
                        details(
                            `🛠️ tool output <code>${msg.tool_call_id}</code>`,
                            fenceMD(renderMessageContent(msg), "json")
                        )
                    )
                    break
                default:
                    res.push(role, fenceMD(YAMLStringify(msg), "yaml"))
                    break
            }
        })
    // Join the result array into a single markdown string.
    return res.filter((s) => s !== undefined).join("\n")
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
