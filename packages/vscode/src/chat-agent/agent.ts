import * as vscode from "vscode"
import { ChatRequestContext, ExtensionState } from "../state"

interface ICatChatAgentResult extends vscode.ChatAgentResult2 {
    slashCommand: string
}

// follow https://github.com/microsoft/vscode/issues/199908

export function toChatAgentContext(
    request: vscode.ChatAgentRequest,
    chatContext: vscode.ChatAgentContext
): ChatAgentContext {
    const roles = {
        [vscode.ChatMessageRole.System]: "system",
        [vscode.ChatMessageRole.User]: "user",
        [vscode.ChatMessageRole.Assistant]: "assistant",
        [vscode.ChatMessageRole.Function]: "function",
    }
    const res: ChatAgentContext = {
        history: chatContext.history,
        prompt: request.prompt || "",
        content: `\`\`\`chat
${chatContext.history
    .map((h) => `${h.name || roles[h.role]}: ${h.content}`)
    .join("\n")}
\`\`\`
`,
    }
    return res
}

export function activateChatAgent(state: ExtensionState) {
    const { context } = state
    const { extensionUri } = context

    const handler: vscode.ChatAgentHandler = async (
        request: vscode.ChatAgentRequest,
        chatContext: vscode.ChatAgentContext,
        progress: vscode.Progress<vscode.ChatAgentProgress>,
        token: vscode.CancellationToken
    ): Promise<ICatChatAgentResult> => {
        const { slashCommand } = request
        const template =
            slashCommand &&
            state.project?.templates.find(({ id }) => id === slashCommand.name)
        const access = await vscode.chat.requestChatAccess("copilot")
        await vscode.commands.executeCommand("coarch.fragment.prompt", {
            chat: <ChatRequestContext>{
                context: toChatAgentContext(request, chatContext),
                progress,
                token,
                access,
            },
            template,
        })
        return { slashCommand: "run" }
    }

    // Agents appear as top-level options in the chat input
    // when you type `@`, and can contribute sub-commands in the chat input
    // that appear when you type `/`.
    const agent = vscode.chat.createChatAgent("gptools", handler)
    agent.iconPath = vscode.Uri.joinPath(extensionUri, "icon.png")
    agent.description = "Run GPTools within the chat..."
    agent.fullName = "GPTools"
    agent.slashCommandProvider = {
        provideSlashCommands(token) {
            const templates =
                state.project?.templates.filter((t) => !t.isSystem) || []
            return [
                ...templates.map(({ id, title, description }) => ({
                    name: id,
                    description: [title, description]
                        .filter((s) => s)
                        .join("\n"),
                })),
                {
                    name: "run",
                    description:
                        "Run a GPTools script against the current context",
                },
            ]
        },
    }

    agent.followupProvider = {
        provideFollowups(
            result: ICatChatAgentResult,
            token: vscode.CancellationToken
        ) {
            /*if (result.slashCommand === "run") {
                return [
                    {
                        commandId: "coarch.fragment.prompt",
                        message: "@gptools running...",
                        title: "Meow!",
                    },
                ]
            }*/
            return []
        },
    }
}
