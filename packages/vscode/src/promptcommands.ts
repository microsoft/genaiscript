import * as vscode from "vscode"
import { Utils } from "vscode-uri"
import { ExtensionState } from "./state"
import { PromptTemplate, copyPrompt } from "genaiscript-core"
import { builtinPromptUri } from "./markdowndocumentprovider"
import { templatesToQuickPickItems } from "./fragmentcommands"
import { saveAllTextDocuments } from "./fs"

const TEMPLATE = `# New specification
    
Description of the spec.
`

export function activatePromptCommands(state: ExtensionState) {
    const { context } = state
    const { subscriptions } = context

    async function showPrompt(fn: string) {
        await state.parseWorkspace()
        await vscode.window.showTextDocument(vscode.Uri.file(fn))
    }

    subscriptions.push(
        vscode.commands.registerCommand("genaiscript.newfile.script", () =>
            vscode.commands.executeCommand("genaiscript.prompt.create")
        ),
        vscode.commands.registerCommand(
            "genaiscript.newfile.gpspec",
            async () => {
                const newFile = Utils.joinPath(
                    vscode.workspace.workspaceFolders[0]?.uri,
                    "untitled.gpspec.md"
                ).with({
                    scheme: "untitled",
                })
                await vscode.workspace.openTextDocument(newFile)
                const edit = new vscode.WorkspaceEdit()
                edit.insert(newFile, new vscode.Position(0, 0), TEMPLATE)
                vscode.workspace.applyEdit(edit)
            }
        ),
        vscode.commands.registerCommand(
            "genaiscript.prompt.refresh",
            async () => {
                await saveAllTextDocuments()
                await state.parseWorkspace()
            }
        ),
        vscode.commands.registerCommand(
            "genaiscript.prompt.create",
            async (template?: PromptTemplate) => {
                const name = await vscode.window.showInputBox({
                    title: "Pick a file name for the new GenAiScript.",
                })
                if (name === undefined) return
                const t = structuredClone(
                    template || {
                        id: "",
                        title: "my tool",
                        text: "New script empty template",
                        jsSource: `// metadata (including model parameters)
// learn more at https://aka.ms/genaiscript
script({ title: "${name}" })

// use def to emit LLM variables
def("FILE", env.files)
// use $ to output formatted text to the prompt
$\`You are a helpful assistant.
TELL THE LLM WHAT TO DO...
\`        
`,
                    }
                )
                t.id = ""

                await showPrompt(await copyPrompt(t, { fork: false, name }))
            }
        ),
        vscode.commands.registerCommand(
            "genaiscript.prompt.fork",
            async (template: PromptTemplate) => {
                if (!template) {
                    if (!state.project) await state.parseWorkspace()
                    const templates = state.project?.templates
                    if (!templates?.length) return
                    const picked = await vscode.window.showQuickPick(
                        templatesToQuickPickItems(templates),
                        {
                            title: `Pick a GenAiScript to fork`,
                        }
                    )
                    if (picked === undefined) return
                    template = picked.template
                }
                const name = await vscode.window.showInputBox({
                    title: `Pick a file name for the new GenAIScript script.`,
                    value: template.id,
                })
                if (name === undefined) return
                await showPrompt(
                    await copyPrompt(template, { fork: true, name })
                )
            }
        ),
        vscode.commands.registerCommand(
            "genaiscript.prompt.unbuiltin",
            async (template: PromptTemplate) => {
                if (!template) return
                await showPrompt(await copyPrompt(template, { fork: false }))
            }
        ),
        vscode.commands.registerCommand(
            "genaiscript.prompt.navigate",
            async (prompt: PromptTemplate) => {
                const uri = prompt.filename
                    ? vscode.Uri.file(prompt.filename)
                    : builtinPromptUri(prompt.id)
                await vscode.window.showTextDocument(uri)
            }
        )
    )
}

export function commandButtons(state: ExtensionState) {
    const request = state.aiRequest
    const { computing } = request || {}
    const abort = "Abort"
    const retry = "Retry"
    const output = "Output"
    const trace = "Trace"
    const cmds: { label: string; description?: string; cmd: string }[] = []
    if (computing) cmds.push({ label: abort, cmd: "genaiscript.request.abort" })
    else if (request)
        cmds.push({
            label: retry,
            description: "Run last script and gpspec again.",
            cmd: "genaiscript.request.retry",
        })
    if (request) {
        cmds.push({
            label: output,
            description: "Preview AI response.",
            cmd: "genaiscript.request.open.output",
        })
        cmds.push({
            label: trace,
            description: "Inspect script execution and LLM response.",
            cmd: "genaiscript.request.open.trace",
        })
    }

    return cmds
}

export function commandButtonsMarkdown(state: ExtensionState, sep = " | ") {
    const res = commandButtons(state)
        .map(({ label, description, cmd }) => `[${label}](command:${cmd})`)
        .join(sep)
    return res
}
