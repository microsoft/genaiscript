import * as vscode from "vscode"
import { ExtensionState } from "./state"
import { TOOL_ID } from "../../core/src/constants"
import { Fragment } from "../../core/src/generation"
import { arrayify } from "../../core/src/util"

export async function activateChatParticipant(state: ExtensionState) {
    const { context } = state
    const { subscriptions } = context

    const participant = vscode.chat.createChatParticipant(
        TOOL_ID,
        async (
            request: vscode.ChatRequest,
            context: vscode.ChatContext,
            response: vscode.ChatResponseStream,
            token: vscode.CancellationToken
        ) => {
            const { command, prompt } = request
            if (command) throw new Error("Command not supported")
            if (!state.project) await state.parseWorkspace()
            if (token.isCancellationRequested) return

            const template = state.project.templates.find(
                (t) => t.id === "chat_participant"
            )
            const fragment: Fragment = {
                files: arrayify([]),
            }
            await state.requestAI({
                template,
                label: "Executing cell",
                parameters: {
                    question: prompt,
                },
                fragment,
                mode: "chat",
            })
        }
    )

    subscriptions.push(participant)
}
