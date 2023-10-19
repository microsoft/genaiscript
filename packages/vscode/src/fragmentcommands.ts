import * as vscode from "vscode"
import {
    Fragment,
    PromptTemplate,
    allChildren,
    groupBy,
    rootFragment,
    templateGroup,
} from "coarch-core"
import { ExtensionState } from "./state"
import { saveAllTextDocuments } from "./fs"

type TemplateQuickPickItem = {
    template: PromptTemplate
} & vscode.QuickPickItem
type ActionQuickPickItem = { action: string } & vscode.QuickPickItem

export function activateFragmentCommands(state: ExtensionState) {
    const { context } = state
    const { subscriptions } = context

    const checkSaved = () => {
        if (vscode.workspace.textDocuments.some((doc) => doc.isDirty)) {
            vscode.window.showErrorMessage(
                "CoArch cancelled. Please save all files before running CoArch."
            )
            return false
        }
        return true
    }

    const pickTemplate = async (
        fragment: Fragment,
        options?: {
            filter?: (p: PromptTemplate) => boolean
        }
    ) => {
        const { filter = () => true } = options || {}
        const templates = fragment.applicableTemplates().filter(filter)
        if (!templates.length) return undefined

        const picked = await vscode.window.showQuickPick(
            templatesToQuickPickItems(templates),
            {
                title: `Pick a prompt to apply to ${fragment.title}`,
            }
        )
        return (picked as TemplateQuickPickItem)?.template
    }

    const fragmentExecute = async (
        fragment: Fragment,
        label: string,
        templateId: string
    ) => {
        if (!fragment) return

        fragment = state.project.fragmentByFullId[fragment.fullId] ?? fragment
        const template = fragment.file.project.getTemplate(templateId)

        await state.requestAI({
            fragment,
            template,
            label,
        })
    }

    const resolveFragment = (frag: Fragment | string) => {
        // "next logic"
        if (frag === undefined && state.aiRequest) {
            const previous = state.aiRequest.options.fragment
            frag = previous?.fullId
        }

        const fragment = rootFragment(state.project.resolveFragment(frag))
        if (!fragment) {
            vscode.window.showErrorMessage(
                "CoArch - sorry, we could not find where to apply the tool. Please try to launch CoArch from the editor."
            )
            return undefined
        }
        return fragment
    }

    const fragmentRefine = async () => {
        const fragment = resolveFragment(undefined)
        if (!fragment) return
        const refinement = await vscode.window.showInputBox({
            title: `What do you want to add to your spec?`,
        })
        if (!refinement) return

        const edit = new vscode.WorkspaceEdit()
        const uri = vscode.Uri.file(fragment.file.filename)
        const meta: vscode.WorkspaceEditEntryMetadata = {
            label: "Insert refinement",
            needsConfirmation: false,
        }
        const lineCount = fragment.text.split("\n").length
        const position = new vscode.Position(lineCount, 0)
        edit.insert(uri, position, refinement, meta)

        await vscode.workspace.applyEdit(edit)
        await saveAllTextDocuments()

        await fragmentPrompt()
    }

    const fragmentPrompt = async (
        frag?: Fragment | string,
        template?: PromptTemplate
    ) => {
        if (!checkSaved()) return
        const fragment = resolveFragment(frag)
        if (!fragment) return
        if (!template) {
            template = await pickTemplate(fragment)
            if (!template) return
        }
        await fragmentExecute(fragment, template.title, template.id)
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
        )
    )
}

function templatesToQuickPickItems(templates: globalThis.PromptTemplate[]) {
    const cats = groupBy(templates, templateGroup)
    const items: vscode.QuickPickItem[] = []
    for (const cat in cats) {
        items.push(<vscode.QuickPickItem>{
            label: cat,
            kind: vscode.QuickPickItemKind.Separator,
        })
        items.push(
            ...cats[cat].map((template) => ({
                label: template.title,
                description: `${template.id} ${template.description || ""}`,
                template,
            }))
        )
    }
    return items
}

export function createCodeActions(fragment: Fragment): vscode.CodeAction[] {
    const templates = fragment.applicableTemplates()
    if (!templates.length) return []
    const action = new vscode.CodeAction(
        `CoArch - Refactor using AI...`,
        vscode.CodeActionKind.QuickFix
    )
    action.command = <vscode.Command>{
        command: "coarch.fragment.prompt",
        tooltip: "Use generative AI to refactor this node",
        arguments: [fragment],
    }
    return [action]
}
