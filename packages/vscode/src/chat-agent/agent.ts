import * as vscode from "vscode"
import { ExtensionState } from "../state"

interface ICatChatAgentResult extends vscode.ChatAgentResult2 {
    slashCommand: string
}

// follow https://github.com/microsoft/vscode/issues/199908

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
        if (slashCommand?.name === "run") {
            await vscode.commands.executeCommand("coarch.fragment.prompt", {
                chat: chatContext,
            })
            return { slashCommand: "run" }
        } else {
            const access = await vscode.chat.requestChatAccess("copilot")
            const messages = [
                {
                    role: vscode.ChatMessageRole.System,
                    content:
                        "You are a cat! Reply in the voice of a cat, using cat analogies when appropriate.",
                },
                {
                    role: vscode.ChatMessageRole.User,
                    content: request.prompt,
                },
            ]
            const chatRequest = access.makeRequest(messages, {}, token)
            for await (const fragment of chatRequest.response) {
                progress.report({ content: fragment })
            }

            return { slashCommand: "" }
        }
    }

    // Agents appear as top-level options in the chat input
    // when you type `@`, and can contribute sub-commands in the chat input
    // that appear when you type `/`.
    const agent = vscode.chat.createChatAgent("gptools", handler)
    agent.iconPath = vscode.Uri.joinPath(extensionUri, "icon.png")
    agent.description = "What tool do you want to run today?"
    agent.fullName = "GPTools"
    agent.slashCommandProvider = {
        provideSlashCommands(token) {
            return [
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
