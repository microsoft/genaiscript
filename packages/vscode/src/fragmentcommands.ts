import * as vscode from "vscode"
import { Utils } from "vscode-uri"
import {
    Fragment,
    PromptTemplate,
    groupBy,
    rootFragment,
    templateGroup,
} from "gptools-core"
import { ChatRequestContext, ExtensionState } from "./state"
import { checkFileExists, saveAllTextDocuments } from "./fs"

type TemplateQuickPickItem = {
    template?: PromptTemplate
    action?: "create
} & vscode.QuickPickItem

export function activateFragmentCommands(state: ExtensionState) {
    const { context } = state
    const { subscriptions } = context

    const pickTemplate = async (
        fragment: Fragment,
        options?: {
            filter?: (p: PromptTemplate) => boolean
        }
    ) => {
        const { filter = () => true } = options || {}
        const templates = fragment.applicableTemplates().filter(filter)

        const picked = await vscode.window.showQuickPick(
            templatesToQuickPickItems(templates, { create: true }),
            {
                title: `Pick a GPTool to apply to ${fragment.title}`,
            }
        )
        if (picked?.action === "create") {
            vscode.commands.executeCommand("coarch.prompt.create")
            return undefined
        } else return (picked as TemplateQuickPickItem)?.template
    }

    const fragmentExecute = async (
        fragment: Fragment,
        label: string,
        templateId: string,
        chat: ChatRequestContext
    ) => {
        if (!fragment) return

        fragment = state.project.fragmentByFullId[fragment.fullId] ?? fragment
        const template = fragment.file.project.getTemplate(templateId)

        await state.cancelAiRequest()
        await state.requestAI({
            fragment,
            template,
            label,
            chat,
        })
    }

    const resolveSpec = async (frag: Fragment | string | vscode.Uri) => {
        // "next logic"
        if (frag === undefined && state.aiRequest) {
            const previous = state.aiRequest.options.fragment
            if (previous && state.host.isVirtualFile(previous.file.filename))
                frag = previous.file.filename.replace(/\.gpspec\.md$/i, "")
            else frag = previous?.fullId
        }

        // active text editor
        if (frag === undefined && vscode.window.activeTextEditor) {
            const document = vscode.window.activeTextEditor.document
            if (document && document.uri.scheme === "file")
                frag = document.uri.fsPath
        }

        if (frag instanceof vscode.Uri) frag = frag.fsPath

        const { project } = state

        let fragment: Fragment
        if (typeof frag === "string" && !/\.gpspec\.md(:.*)?$/i.test(frag)) {
            let document = vscode.workspace.textDocuments.find(
                (document) => document.uri.fsPath === frag
            )
            if (!document && (await checkFileExists(vscode.Uri.file(frag))))
                document = await vscode.workspace.openTextDocument(frag)
            if (document) {
                const prj = await state.parseDocument(document)
                fragment = prj?.rootFiles?.[0].fragments?.[0]
            }
        } else {
            fragment = project.resolveFragment(frag)
        }

        return rootFragment(fragment)
    }

    const fragmentRefine = async () => {
        await state.cancelAiRequest()
        const fragment = await resolveSpec(undefined)
        if (!fragment) return

        const template = state.aiRequest.options.template
        let refinement = await vscode.window.showInputBox({
            title: `What do you want to add to your spec?`,
            prompt: `Your recommendation will be added at the end of the gpspec.md file; then the tool will be started again.`,
        })
        if (!refinement) return

        await saveAllTextDocuments()
        const uri = vscode.Uri.file(fragment.file.filename)
        let content = new TextDecoder().decode(
            await vscode.workspace.fs.readFile(uri)
        )

        // insert in top fragment
        const lines = content.split("\n")
        lines.splice(fragment.endPos[0], 0, `-   ${refinement}`)

        content = lines.join("\n")

        vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(content))
        await saveAllTextDocuments()

        vscode.window.showInformationMessage(
            `GPTools - Added refinement in ${Utils.basename(
                vscode.Uri.file(fragment.file.filename)
            )}. Please wait for the tool to start again.`
        )

        await fragmentPrompt({ fragment, template })
    }

    const fragmentPrompt = async (
        options:
            | {
                  fragment?: Fragment | string | vscode.Uri
                  template?: PromptTemplate
                  chat?: ChatRequestContext
              }
            | vscode.Uri
    ) => {
        await saveAllTextDocuments
        await state.parseWorkspace()

        if (typeof options === "object" && options instanceof vscode.Uri)
            options = { fragment: options }
        let { fragment, template, chat } = options || {}

        await state.cancelAiRequest()
        fragment = await resolveSpec(fragment)
        if (!fragment) {
            vscode.window.showErrorMessage(
                "GPTools - sorry, we could not find where to apply the tool. Please try to launch GPTools from the editor."
            )
            return
        }
        if (!template) {
            template = await pickTemplate(fragment, {
                filter: (t) => t.chat !== true,
            })
            if (!template) return
        }
        await fragmentExecute(fragment, template.title, template.id, chat)
    }
    const fragmentNavigate = async (fragment: Fragment | string) => {
        fragment = state.project.resolveFragment(fragment)
        if (!fragment) return
        const { file, startPos } = fragment
        const uri = vscode.Uri.file(file.filename)
        const editor = await vscode.window.showTextDocument(uri)
        const pos = new vscode.Position(...startPos)
        editor.selections = [new vscode.Selection(pos, pos)]
        var range = new vscode.Range(pos, pos)
        editor.revealRange(range)
    }

    const applyEdits = async () => state.applyEdits()

    subscriptions.push(
        vscode.commands.registerCommand(
            "coarch.fragment.refine",
            fragmentRefine
        ),
        vscode.commands.registerCommand(
            "coarch.fragment.prompt",
            fragmentPrompt
        ),
        vscode.commands.registerCommand(
            "coarch.fragment.navigate",
            fragmentNavigate
        ),
        vscode.commands.registerCommand("coarch.request.applyEdits", applyEdits)
    )
}

export function templatesToQuickPickItems(
    templates: globalThis.PromptTemplate[],
    options?: { create?: boolean }
): TemplateQuickPickItem[] {
    const { create } = options || {}
    const cats = groupBy(templates, templateGroup)
    const items: vscode.QuickPickItem[] = []
    for (const cat in cats) {
        items.push(<vscode.QuickPickItem>{
            label: cat,
            kind: vscode.QuickPickItemKind.Separator,
        })
        items.push(
            ...cats[cat].map(
                (template) =>
                    <TemplateQuickPickItem>{
                        label: template.title,
                        description: `${template.id} ${
                            template.description || ""
                        }`,
                        template,
                    }
            )
        )
    }
    if (create) {
        items.push(<vscode.QuickPickItem>{
            label: "",
            kind: vscode.QuickPickItemKind.Separator,
        })
        items.push(<TemplateQuickPickItem>{
            label: "Create a new GPTool script...",
            description: "Create a new gptool script in the current workspace.",
            action: "create",
        })
    }
    return items
}
