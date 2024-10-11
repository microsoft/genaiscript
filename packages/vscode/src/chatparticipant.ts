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
        references: readonly vscode.ChatPromptReference[]
    ): { files: string[]; vars: Record<string, string> } => {
        const files = []
        const vars: Record<string, string> = {}
        for (const reference of references) {
            const { id, value } = reference
            if (value instanceof vscode.Uri)
                files.push(vscode.workspace.asRelativePath(value, false))
            else if (typeof value === "string") vars[id] = value
            else if (value instanceof vscode.Location)
                files.push(vscode.workspace.asRelativePath(value.uri, false)) // TODO range
        }
        return { files, vars }
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
            const { files, vars } = resolveReference(references)
            const fragment: Fragment = {
                files,
            }

            const canceller = token.onCancellationRequested(
                async () => await state.cancelAiRequest()
            )
            const res = await state.requestAI({
                template,
                label: "genaiscript agent",
                parameters: {
                    ...vars,
                    question: prompt,
                },
                fragment,
                mode: "chat",
            })
            canceller.dispose()
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
