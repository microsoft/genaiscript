// cspell: disable
import * as vscode from "vscode"
import { ExtensionState } from "./state"
import {
    COPILOT_CHAT_PARTICIPANT_SCRIPT_ID,
    COPILOT_CHAT_PARTICIPANT_ID,
    ICON_LOGO_NAME,
    CACHE_AIREQUEST_TRACE_PREFIX,
    CACHE_AIREQUEST_TEXT_PREFIX,
} from "../../core/src/constants"
import { Fragment } from "../../core/src/generation"
import { convertAnnotationsToItems } from "../../core/src/annotations"
import { dedent } from "../../core/src/indent"
import {
    ChatCompletionAssistantMessageParam,
    ChatCompletionUserMessageParam,
} from "../../core/src/chattypes"
import { deleteUndefinedValues } from "../../core/src/util"
import { templatesToQuickPickItems } from "./fragmentcommands"

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

            const md = (t: string) => {
                response.markdown(new vscode.MarkdownString(t, true))
            }

            const { project } = state
            const { templates } = project
            let template: PromptScript
            if (command === "run") {
                const scriptid = prompt.split(" ")[0]
                prompt = prompt.slice(scriptid.length).trim()
                template = templates.find((t) => t.id === scriptid)
                if (!template) {
                    md(`$(error) Oops, I could not find any genaiscript matching \`${scriptid}\`. Try one of the following:
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
                    const picked = await vscode.window.showQuickPick(
                        templatesToQuickPickItems(templates),
                        {
                            title: `Pick a GenAIScript to run`,
                        }
                    )
                    template = picked?.template
                    if (!template) {
                        md(`\n\n$(error) Cancelled, no script selected.`)
                        return
                    }
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
                    ["copilot.history"]: history,
                    question: prompt,
                }),
                fragment,
                mode: "chat",
            })
            canceller.dispose()
            if (token.isCancellationRequested) return

            const { text = "", status, statusText } = res || {}
            if (status !== "success") md("$(error) " + statusText)
            if (text) md("\n\n" + convertAnnotationsToItems(text))
            const buttons = new vscode.MarkdownString(
                `\n\n[output](command:genaiscript.request.open?${encodeURIComponent(JSON.stringify([CACHE_AIREQUEST_TEXT_PREFIX + res.requestSha + ".md"]))}) | [trace](command:genaiscript.request.open?${encodeURIComponent(JSON.stringify([CACHE_AIREQUEST_TRACE_PREFIX + res.requestSha + ".md"]))})`,
                true
            )
            buttons.isTrusted = {
                enabledCommands: ["genaiscript.request.open"],
            }
            response.markdown(buttons)
        }
    )
    participant.iconPath = new vscode.ThemeIcon(ICON_LOGO_NAME)

    subscriptions.push(participant)
}

function renderHistory(
    context: vscode.ChatContext
): (HistoryMessageUser | HistoryMessageAssistant)[] {
    const { history } = context
    if (!history?.length) return undefined
    const res = history
        .map((message) => {
            if (message instanceof vscode.ChatRequestTurn) {
                return {
                    role: "user",
                    content: message.prompt,
                } satisfies HistoryMessageUser
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
                } as HistoryMessageAssistant
            } else return undefined
        })
        .filter((f) => !!f)
    return res.length ? res : undefined
}
