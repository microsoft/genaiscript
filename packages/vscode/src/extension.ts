import * as vscode from "vscode"
import { ExtensionContext } from "vscode"
import { ExtensionState } from "./state"
import { activateFragmentTreeDataProvider } from "./fragmenttree"
import { activateStatusBar } from "./statusbar"
import "isomorphic-fetch"
import { initToken, isCancelError } from "coarch-core"
import { activateCodeActions } from "./codeactions"
import { activateFragmentCommands } from "./fragmentcommands"
import { activateDecorators } from "./decorators"
import { activateMarkdownTextDocumentContentProvider } from "./markdowndocumentprovider"
import { activatePrompTreeDataProvider } from "./prompttree"
import { activatePromptCommands } from "./promptcommands"
import { clearToken } from "coarch-core"
import { activateRunnerView } from "./runnerview"
import { activateRequestTreeDataProvider } from "./requesttree"

export const COARCH_EXTENSION_ID = "coarch.coarch-vscode"

export async function activate(context: ExtensionContext) {
    const state = new ExtensionState(context)
    activatePrompTreeDataProvider(state)
    activateFragmentTreeDataProvider(state)
    activateRunnerView(state)
    activateRequestTreeDataProvider(state)
    activateStatusBar(state)
    activateCodeActions(state)
    activateFragmentCommands(state)
    //activateDecorators(state)
    //activateCodeLens(state);
    activateMarkdownTextDocumentContentProvider(state)
    activatePromptCommands(state)

    context.subscriptions.push(
        vscode.commands.registerCommand("coarch.request.cancel", async () => {
            await state.cancelAiRequest()
            await vscode.window.showInformationMessage(
                "CoArch - request cancelled."
            )
        }),
        vscode.commands.registerCommand(
            "coarch.openai.token.clear",
            async () => {
                await clearToken()
                await vscode.window.showInformationMessage(
                    "CoArch - OpenAI token cleared."
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
            const r = state.aiRequest
            const { computing, options } = r || {}
            if (!computing) {
                vscode.commands.executeCommand("coarch.request.open")
            } else {
                const { template } = options || {}
                const cancel = "Cancel"
                const trace = "Open Trace"
                const res = await vscode.window.showInformationMessage(
                    `CoArch - running ${template.title}`,
                    trace,
                    cancel
                )
                if (res === cancel)
                    vscode.commands.executeCommand("coarch.request.cancel")
                else if (res === trace)
                    vscode.commands.executeCommand("coarch.request.open")
            }
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
                    issueBody.push(state.aiRequest.response.info)
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
