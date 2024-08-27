import {
    ChatCompletionAssistantMessageParam,
    ChatCompletionMessageParam,
    ChatCompletionSystemMessageParam,
    ChatCompletionToolMessageParam,
} from "./chattypes"
import { JSON5TryParse } from "./json5"
import { details, fenceMD } from "./markdown"
import { YAMLStringify } from "./yaml"

export function renderShellOutput(output: ShellOutput) {
    const { exitCode, stdout, stderr } = output
    return [
        `EXIT_CODE: ${exitCode}`,
        stdout ? `STDOUT:${fenceMD(stdout, "text")}` : undefined,
        stderr ? `STDERR:${fenceMD(stderr, "text")}` : undefined,
    ]
        .filter((s) => s)
        .join("\n\n")
}

export function renderMessageContent(
    msg:
        | ChatCompletionAssistantMessageParam
        | ChatCompletionSystemMessageParam
        | ChatCompletionToolMessageParam
): string {
    const content = msg.content
    if (typeof content === "string") return content
    else if (Array.isArray(content))
        return content
            .map((c) => (c.type === "text" ? c.text : c.refusal))
            .join(` `)
    return undefined
}

export function renderMessagesToMarkdown(
    messages: ChatCompletionMessageParam[],
    options?: {
        system?: boolean
        user?: boolean
        assistant?: boolean
    }
) {
    const {
        system = undefined,
        user = undefined,
        assistant = true,
    } = options || {}
    const res: string[] = []
    messages
        ?.filter((msg) => {
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
                    else if (Array.isArray(msg.content))
                        for (const part of msg.content) {
                            if (part.type === "text")
                                content = fenceMD(part.text, "markdown")
                            else if (part.type === "image_url")
                                content = `![image](${part.image_url.url})`
                            else content = fenceMD(YAMLStringify(part), "yaml")
                        }
                    else content = fenceMD(YAMLStringify(msg), "yaml")
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
    return res.filter((s) => s !== undefined).join("\n")
}

function renderToolArguments(args: string) {
    const js = JSON5TryParse(args)
    if (js) return fenceMD(YAMLStringify(js), "yaml")
    else return fenceMD(args, "json")
}
