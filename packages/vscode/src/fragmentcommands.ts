import * as vscode from "vscode"
import { Utils } from "vscode-uri"
import {
    Fragment,
    PromptTemplate,
    groupBy,
    rootFragment,
    templateGroup,
} from "genaiscript-core"
import { ChatRequestContext, ExtensionState } from "./state"
import {
    checkDirectoryExists,
    checkFileExists,
    saveAllTextDocuments,
} from "./fs"

type TemplateQuickPickItem = {
    template?: PromptTemplate
    action?: "create"
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
                title: `Pick a GenAiScript to apply to ${fragment.title}`,
            }
        )
        if (picked?.action === "create") {
            vscode.commands.executeCommand("genaiscript.prompt.create")
            return undefined
        } else return (picked as TemplateQuickPickItem)?.template
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
            const fragUri = vscode.Uri.file(frag)
            let document = vscode.workspace.textDocuments.find(
                (document) => document.uri.fsPath === frag
            )
            if (!document && (await checkFileExists(fragUri)))
                document = await vscode.workspace.openTextDocument(fragUri)
            if (document) {
                const prj = await state.parseDocument(document)
                fragment = prj?.rootFiles?.[0].fragments?.[0]
            }

            if (!fragment) {
                if (await checkDirectoryExists(fragUri)) {
                    const prj = await state.parseDirectory(fragUri)
                    fragment = prj?.rootFiles?.[0].fragments?.[0]
                }
            }
        } else {
            fragment = project.resolveFragment(frag)
        }

        return rootFragment(fragment)
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
        if (typeof options === "object" && options instanceof vscode.Uri)
            options = { fragment: options }
        let { fragment, template, chat } = options || {}

        await state.cancelAiRequest()

        if (chat?.response)
            chat.response.progress("Preparing script")

        await saveAllTextDocuments
        await state.parseWorkspace()

        fragment = await resolveSpec(fragment)
        if (!fragment) {
            vscode.window.showErrorMessage(
                "GenAIScript - sorry, we could not find where to apply the tool. Please try to launch GenAIScript from the editor."
            )
            return
        }
        if (!template) {
            template = await pickTemplate(fragment, {
                filter: (t) => t.chat !== true,
            })
            if (!template) return
        }

        if (!fragment) return

        fragment = state.project.fragmentByFullId[fragment.fullId] ?? fragment
        await state.requestAI({
            fragment,
            template,
            label: template.id,
            chat,
        })
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
            "genaiscript.fragment.prompt",
            fragmentPrompt
        ),
        vscode.commands.registerCommand(
            "genaiscript.fragment.navigate",
            fragmentNavigate
        ),
        vscode.commands.registerCommand("genaiscript.request.applyEdits", applyEdits)
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
            label: "Create a new GenAiScript script...",
            description: "Create a new script script in the current workspace.",
            action: "create",
        })
    }
    return items
}
