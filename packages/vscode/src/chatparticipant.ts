import * as vscode from "vscode"
import { ExtensionState } from "./state"
import { TOOL_ID } from "../../core/src/constants"
import { Fragment } from "../../core/src/generation"
import { prettifyMarkdown } from "../../core/src/markdown"
import { eraseAnnotations } from "../../core/src/annotations"

export async function activateChatParticipant(state: ExtensionState) {
    const { context } = state
    const { subscriptions } = context

    const resolveReference = (
        reference: vscode.ChatPromptReference
    ): string => {
        const { value, range } = reference
        if (value instanceof vscode.Uri)
            return vscode.workspace.asRelativePath(value, false)
        else if (typeof value === "string") return value
        else if (value instanceof vscode.Location)
            return vscode.workspace.asRelativePath(value.uri, false) // TODO range
        else return undefined
    }

    const participant = vscode.chat.createChatParticipant(
        TOOL_ID,
        async (
            request: vscode.ChatRequest,
            context: vscode.ChatContext,
            response: vscode.ChatResponseStream,
            token: vscode.CancellationToken
        ) => {
            const { command, prompt, references } = request
            if (command) throw new Error("Command not supported")
            if (!state.project) await state.parseWorkspace()
            if (token.isCancellationRequested) return

            const template = state.project.templates.find(
                (t) => t.id === "copilot_chat_participant"
            )
            const fragment: Fragment = {
                files: references.map(resolveReference),
            }

            const res = await state.requestAI({
                template,
                label: "genaiscript agent",
                parameters: {
                    question: prompt,
                },
                fragment,
                mode: "chat",
            })

            if (token.isCancellationRequested) return

            const { text = "" } = res || {}
            response.markdown(
                new vscode.MarkdownString(
                    prettifyMarkdown(eraseAnnotations(text)),
                    true
                )
            )
        }
    )

    subscriptions.push(participant)
}
