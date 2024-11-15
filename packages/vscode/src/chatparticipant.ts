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
import {
    ChatCompletionAssistantMessageParam,
    ChatCompletionUserMessageParam,
} from "../../core/src/chattypes"
import { deleteUndefinedValues } from "../../core/src/util"

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
            if (typeof value === "string") vars[id] = value
            else if (value instanceof vscode.Uri)
                files.push(vscode.workspace.asRelativePath(value, false))
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
            const history = renderHistory(context)
            const fragment: Fragment = {
                files,
            }

            const canceller = token.onCancellationRequested(
                async () => await state.cancelAiRequest()
            )
            const res = await state.requestAI({
                template,
                label: "genaiscript agent",
                parameters: deleteUndefinedValues({
                    ...vars,
                    history,
                    question: prompt,
                }),
                fragment,
                mode: "chat",
            })
            canceller.dispose()
            if (token.isCancellationRequested) return

            const { text = "", status, statusText } = res || {}
            if (status !== "success")
                response.markdown(
                    new vscode.MarkdownString("$(error) " + statusText, true)
                )
            if (text) {
                response.markdown(
                    new vscode.MarkdownString(
                        cleanMarkdown(convertAnnotationsToItems(text)),
                        true
                    )
                )
            }
            const buttons = new vscode.MarkdownString(
                `\n[output](command:genaiscript.request.open.output) | [trace](command:genaiscript.request.open.trace)`,
                true
            )
            buttons.isTrusted = {
                enabledCommands: [
                    "genaiscript.request.open.output",
                    "genaiscript.request.open.trace",
                ],
            }
            response.markdown(buttons)
        }
    )
    participant.iconPath = new vscode.ThemeIcon(ICON_LOGO_NAME)

    subscriptions.push(participant)
}

function renderHistory(context: vscode.ChatContext): string {
    const { history } = context
    if (!history?.length) return undefined
    const res = history
        .map((message) => {
            if (message instanceof vscode.ChatRequestTurn) {
                return {
                    role: "user",
                    content: message.prompt,
                } satisfies ChatCompletionUserMessageParam
            } else if (message instanceof vscode.ChatResponseTurn) {
                return {
                    role: "assistant",
                    name: message.participant,
                    content: message.response
                        .map((r) => {
                            if (r instanceof vscode.ChatResponseMarkdownPart) {
                                return r.value.value
                            } else if (
                                r instanceof vscode.ChatResponseAnchorPart
                            ) {
                                if (r.value instanceof vscode.Uri)
                                    return vscode.workspace.asRelativePath(
                                        r.value.fsPath
                                    )
                                else
                                    return vscode.workspace.asRelativePath(
                                        r.value.uri.fsPath
                                    )
                            }
                            return ""
                        })
                        .join(""),
                } as ChatCompletionAssistantMessageParam
            } else return undefined
        })
        .filter((f) => !!f)
    if (res.length) return JSON.stringify(res)
    else return undefined
}
