import * as vscode from "vscode"
import { ExtensionContext } from "vscode"
import { ExtensionState } from "./state"
import { activateStatusBar } from "./statusbar"
import { activateFragmentCommands } from "./fragmentcommands"
import { activateMarkdownTextDocumentContentProvider } from "./markdowndocumentprovider"
import { activatePrompTreeDataProvider } from "./prompttree"
import { activatePromptCommands, commandButtons } from "./promptcommands"
import { activateLLMRequestTreeDataProvider } from "./llmrequesttree"
import { activateAIRequestTreeDataProvider } from "./airequesttree"
import { activateTestController } from "./testcontroller"
import { activateDocsNotebook } from "./docsnotebook"
import { activateTraceTreeDataProvider } from "./tracetree"
import { registerCommand } from "./commands"
import { EXTENSION_ID, TOOL_NAME } from "../../core/src/constants"
import type MarkdownIt from "markdown-it"
import MarkdownItGitHubAlerts from "markdown-it-github-alerts"

export async function activate(context: ExtensionContext) {
    const state = new ExtensionState(context)
    activatePromptCommands(state)
    activateFragmentCommands(state)
    activateMarkdownTextDocumentContentProvider(state)
    activatePrompTreeDataProvider(state)
    activateAIRequestTreeDataProvider(state)
    activateLLMRequestTreeDataProvider(state)
    activateTraceTreeDataProvider(state)
    activateStatusBar(state)
    activateDocsNotebook(state)

    context.subscriptions.push(
        registerCommand("genaiscript.request.abort", async () => {
            await state.cancelAiRequest()
            await vscode.window.showInformationMessage(
                `${TOOL_NAME} - request aborted.`
            )
        }),
        registerCommand("genaiscript.request.status", async () => {
            const cmds = commandButtons(state)
            if (!cmds.length)
                await vscode.window.showInformationMessage(
                    `${TOOL_NAME} - no request.`
                )
            else {
                const res = await vscode.window.showQuickPick(cmds, {
                    canPickMany: false,
                })
                if (res) vscode.commands.executeCommand(res.cmd)
            }
        }),
        registerCommand("genaiscript.info.env", async () => {
            state.host.server.client.infoEnv()
        }),
        registerCommand("genaiscript.openIssueReporter", async () => {
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
                `extension: ${context.extension?.packageJSON?.version || "?"}`
            )
            if (state.aiRequest?.trace) {
                issueBody.push(`## Trace\n\n`)
                issueBody.push(state.aiRequest?.trace?.content)
                issueBody.push(`\n\n`)
            }
            await vscode.commands.executeCommand(
                "workbench.action.openIssueReporter",
                {
                    extensionId: EXTENSION_ID,
                    issueBody: issueBody.join("\n"),
                }
            )
        })
    )

    await state.activate()
    await activateTestController(state)

    return {
        extendMarkdownIt: (md: MarkdownIt) => {
            return md.use(MarkdownItGitHubAlerts)
        },
    }
}
