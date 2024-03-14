/* eslint-disable @typescript-eslint/naming-convention */
import * as vscode from "vscode"
import { ChatRequestContext, ExtensionState } from "../state"
import { CHAT_PARTICIPANT_ID, MarkdownTrace, logInfo } from "genaiscript-core"
import { isApiProposalEnabled } from "../proposals"

interface ICatChatAgentResult extends vscode.ChatResult {
    template?: PromptTemplate
}

// follow https://github.com/microsoft/vscode/issues/199908
// https://github.com/microsoft/vscode/issues/205609#issue-2143213494

function wrapComment(text: string) {
    if (!text) return ""
    const lines = text.split("\n")
    if (lines.length === 1) return `// ${text}\n`
    else return `/*\n${lines.map((l) => ` * ${l}`).join("\n")}\n */\n`
}

function chatRequestToPromptTemplate(
    request: vscode.ChatRequest,
    context: vscode.ChatContext
): PromptTemplate {
    const args: PromptArgs = {}
    let jsSource = `def("FILE", env.files)\n\n`

    const appendPrompt = (content: string) => {
        if (content) jsSource += `$\`${content.replace(/`/g, "\\`")}\`\n`
    }

    for (const msg of context.history) {
        /* TODO
        const { request, response } = msg
        const { agentId, command, content } = request

        // process input
        if (agentId === CHAT_PARTICIPANT_ID) {
            if (command) {
                // calling into another template
                // TODO
                jsSource += wrapComment(`${agentId}: ${content}`)
            } else {
                // no subcommand, just add the content
                appendPrompt(content)
            }
        } else if (agentId === "copilot" || agentId === "") {
            // other agent id, not supported
            // TODO
            appendPrompt(content)
        } else jsSource += wrapComment(`${agentId}: ${content}`)
        */
    }

    if (!request.command) appendPrompt(request.prompt)

    jsSource = `script(${JSON.stringify({ ...args }, null, 4)})\n\n${jsSource}`

    const template: PromptTemplate = {
        ...args,
        id: "copilot",
        jsSource,
    }

    return template
}

export function activateChatParticipant(state: ExtensionState) {
    const { context } = state

    if (
        !isApiProposalEnabled(context, "chatParticipant", "github.copilot-chat")
    )
        return

    logInfo("activating chat agent")
    const { extensionUri } = context

    const handler: vscode.ChatExtendedRequestHandler = async (
        request: vscode.ChatRequest,
        chatContext: vscode.ChatContext,
        response: vscode.ChatResponseStream,
        token: vscode.CancellationToken
    ): Promise<ICatChatAgentResult> => {
        const res = <ICatChatAgentResult>{}
        response.progress("Generating script")
        const template = chatRequestToPromptTemplate(request, chatContext)
        res.template = template

        const message = new MarkdownTrace()
        message.log(`We generated this script from the chat history:`)
        message.fence(res.template.jsSource, "javascript")
        response.markdown(message.content)

        await vscode.commands.executeCommand("genaiscript.fragment.prompt", {
            chat: <ChatRequestContext>{
                context,
                response,
                token,
            },
            template,
        })
        return res
    }

    // Agents appear as top-level options in the chat input
    // when you type `@`, and can contribute sub-commands in the chat input
    // that appear when you type `/`.
    const agent = vscode.chat.createChatParticipant(
        CHAT_PARTICIPANT_ID,
        handler
    )
    agent.iconPath = vscode.Uri.joinPath(extensionUri, "icon.png")
    agent.description = "Generate script from history..."
}
