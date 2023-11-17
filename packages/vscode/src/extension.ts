import * as vscode from "vscode"
import { ExtensionContext } from "vscode"
import { ExtensionState } from "./state"
import { activateStatusBar } from "./statusbar"
import "isomorphic-fetch"
import { initToken, isCancelError } from "coarch-core"
import { activateCodeActions } from "./codeactions"
import { activateFragmentCommands } from "./fragmentcommands"
import { activateMarkdownTextDocumentContentProvider } from "./markdowndocumentprovider"
import { activatePrompTreeDataProvider } from "./prompttree"
import { activatePromptCommands, commandButtons } from "./promptcommands"
import { clearToken } from "coarch-core"
import { activateOpenAIRequestTreeDataProvider } from "./openairequesttree"
import { activateAIRequestTreeDataProvider } from "./airequesttree"

export const COARCH_EXTENSION_ID = "coarch.gptools-vscode"

function toStringList(...token: string[]) {
    const md = token.filter((l) => l !== undefined && l !== null).join("\n")
    return md
}

export async function activate(context: ExtensionContext) {
    const state = new ExtensionState(context)
    activatePromptCommands(state)
    activateFragmentCommands(state)
    activateMarkdownTextDocumentContentProvider(state)
    activatePrompTreeDataProvider(state)
    //activateFragmentTreeDataProvider(state)
    activateAIRequestTreeDataProvider(state)
    activateOpenAIRequestTreeDataProvider(state)
    // activateRunnerView(state)
    activateStatusBar(state)
    activateCodeActions(state)

    context.subscriptions.push(
        vscode.commands.registerCommand("coarch.request.abort", async () => {
            await state.cancelAiRequest()
            await vscode.window.showInformationMessage(
                "GPTools - request aborted."
            )
        }),
        vscode.commands.registerCommand(
            "coarch.openai.token.clear",
            async () => {
                await clearToken()
                await vscode.window.showInformationMessage(
                    "GPTools - OpenAI token cleared."
                )
            }
        ),
        vscode.commands.registerCommand(
            "coarch.openai.token.update",
            async () => {
                try {
                    await clearToken()
                    await initToken(true)
                } catch (e) {
                    if (isCancelError(e)) return
                    throw e
                }
            }
        ),
        vscode.commands.registerCommand("coarch.request.status", async () => {
            const request = state.aiRequest
            const { computing, options, editsApplied, response } = request || {}
            const { text } = response || {}
            const { template } = options || {}

            const cmds = commandButtons(state)

            const res = await vscode.window.showInformationMessage(
                toStringList(
                    computing
                        ? `GPTools - running ${template.title}`
                        : template
                        ? `GPTools - ${template.title}`
                        : "GPTools"
                ),
                ...cmds.map(({ title }) => title)
            )
            const cmd = cmds.find(({ title }) => title === res)
            if (cmd) vscode.commands.executeCommand(cmd.cmd)
        }),
        vscode.commands.registerCommand(
            "coarch.openIssueReporter",
            async () => {
                const issueBody: string[] = [
                    `## Describe the issue`,
                    `A clear and concise description of what the bug is.`,
                    ``,
                    `## To Reproduce`,
                    `Steps to reproduce the behavior`,
                    ``,
                    `## Expected behavior`,
                    `A clear and concise description of what you expected to happen.`,
                    ``,
                    `## Environment`,
                    ``,
                ]
                issueBody.push(`vscode: ${vscode.version}`)
                issueBody.push(
                    `extension: ${
                        context.extension?.packageJSON?.version || "?"
                    }`
                )
                if (state.aiRequest?.response) {
                    issueBody.push(`## Request`)
                    issueBody.push("`````")
                    issueBody.push(state.aiRequest.response.trace)
                    issueBody.push("`````")
                }
                await vscode.commands.executeCommand(
                    "workbench.action.openIssueReporter",
                    {
                        extensionId: COARCH_EXTENSION_ID,
                        issueBody: issueBody.join("\n"),
                    }
                )
            }
        )
    )

    await state.activate()
}
