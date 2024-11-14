import * as vscode from "vscode"
import { ExtensionState } from "./state"
import {
    COPILOT_CHAT_PARTICIPANT_SCRIPT_ID,
    COPILOT_CHAT_PARTICIPANT_ID,
    ICON_LOGO_NAME,
} from "../../core/src/constants"
import { Fragment } from "../../core/src/generation"
import { cleanMarkdown } from "../../core/src/markdown"
import { convertAnnotationsToItems } from "../../core/src/annotations"
import { dedent } from "../../core/src/indent"

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
        COPILOT_CHAT_PARTICIPANT_ID,
        async (
            request: vscode.ChatRequest,
            context: vscode.ChatContext,
            response: vscode.ChatResponseStream,
            token: vscode.CancellationToken
        ) => {
            let { command, prompt, references, model } = request
            await state.parseWorkspace()
            if (token.isCancellationRequested) return

            let template: PromptScript
            if (command === "run") {
                const scriptid = prompt.split(" ")[0]
                prompt = prompt.slice(scriptid.length).trim()
                template = state.project.templates.find(
                    (t) => t.id === scriptid
                )
                if (!template) {
                    response.markdown(dedent`Oops, I could not find any genaiscript matching \`${scriptid}\`. Try one of the following:
                    ${state.project.templates
                        .filter((s) => !s.system && !s.unlisted)
                        .map((s) => `- \`${s.id}\`: ${s.title}`)
                        .join("\n")}
                    `)
                    return
                }
            } else {
                template = state.project.templates.find(
                    (t) => t.id === COPILOT_CHAT_PARTICIPANT_SCRIPT_ID
                )
                if (!template) {
                    response.markdown(
                        dedent`The \`${COPILOT_CHAT_PARTICIPANT_SCRIPT_ID}\` script has not been configured yet in this workspace.

                        Save the [starter script template](https://microsoft.github.io/genaiscript/reference/vscode/github-copilot-chat#copilotchat) in your workspace to get started.`
                    )
                    return
                }
            }
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
            if (text) {
                response.markdown(
                    new vscode.MarkdownString(
                        cleanMarkdown(convertAnnotationsToItems(text)),
                        true
                    )
                )
                response.button({
                    command: "genaiscript.request.open.output",
                    tooltip: "Open generated markdown in Preview mode",
                    title: "Open Preview",
                })
            }
        }
    )
    participant.iconPath = new vscode.ThemeIcon(ICON_LOGO_NAME)

    subscriptions.push(participant)
}
