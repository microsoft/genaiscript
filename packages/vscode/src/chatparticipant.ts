import * as vscode from "vscode"
import { ExtensionState } from "./state"
import { TOOL_ID } from "../../core/src/constants"
import { parsePromptScriptMeta } from "../../core/src/template"
import { Fragment } from "../../core/src/generation"
import { arrayify } from "../../core/src/util"
import { resolveSystems, resolveTools } from "../../core/src/systems"

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

            const jsSource = `
script({ tools: ["agent"] })

$\`## task

- make a plan to answer the QUESTION step by step
- answer the QUESTION

## guidance:
    - use the agent tools to help you
    - do NOT try to ask the user questions directly, use the agent_user_input tool instead.

\`
def("QUESTION", ${JSON.stringify(prompt)})
`
            const meta = parsePromptScriptMeta(jsSource)
            meta.system = resolveSystems(state.project, meta)
            meta.tools = resolveTools(
                state.project,
                meta.system,
                arrayify(meta.tools)
            ).map(({ id }) => id)
            const fragment: Fragment = {
                files: arrayify([]),
            }
            const template: PromptScript = {
                ...meta,
                id: "copilot-chat",
                jsSource,
            }
            await state.requestAI({
                template,
                label: "Executing cell",
                parameters: {},
                fragment,
                mode: "chat",
                jsSource,
            })
        }
    )

    subscriptions.push(participant)
}
