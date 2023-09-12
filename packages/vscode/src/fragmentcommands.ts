import * as vscode from "vscode"
import {
    Fragment,
    PromptTemplate,
    allChildren,
    groupBy,
    templateGroup,
} from "coarch-core"
import { ExtensionState } from "./state"

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
            templatesToQuickPickItems(templates)
        )
        return (picked as TemplateQuickPickItem)?.template
    }

    const pickTemplateOrAction = async (
        fragment: Fragment,
        options: {
            filter?: (p: PromptTemplate) => boolean
            actions: ActionQuickPickItem[]
        }
    ) => {
        const { filter, actions } = options
        const templates = fragment.applicableTemplates().filter(filter)

        if (templates.length === 0 && actions.length === 1)
            return actions[0].action

        const picked = await vscode.window.showQuickPick<
            vscode.QuickPickItem | TemplateQuickPickItem | ActionQuickPickItem
        >([
            ...templatesToQuickPickItems(templates),
            {
                label: "Actions",
                kind: vscode.QuickPickItemKind.Separator,
            },
            ...actions,
        ])
        return (
            (picked as TemplateQuickPickItem)?.template ||
            (picked as ActionQuickPickItem)?.action
        )
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
            fragments: [fragment],
            template,
            label,
        })
    }

    const fragmentPrompt = async (
        frag: Fragment | string,
        template: PromptTemplate
    ) => {
        if (!checkSaved()) return

        const fragment = state.project.resolveFragment(frag)
        if (!fragment) return
        if (!template) {
            template = await pickTemplate(fragment)
            if (!template) return
        }
        await fragmentExecute(fragment, template.title, template.id)
    }
    const fragmentAudit = async (fragment: Fragment) => {
        if (!checkSaved()) return
        if (!fragment) return

        const res = await pickTemplateOrAction(fragment, {
            filter: (p) => p.audit,
            actions: [
                {
                    label: "Mark Audited",
                    action: "audited",
                },
                fragment.children?.length > 0
                    ? {
                          label: "Mark Self and Children Audited",
                          action: "auditedtree",
                      }
                    : undefined,
            ].filter((a) => !!a),
        })
        if (!res) return
        else if (typeof res === "string") {
            if (res === "audited")
                await state.markSyncedFragment(fragment, "sync")
            else if (res === "auditedtree") {
                const children = allChildren(fragment)
                await state.markSyncedFragment([fragment, ...children], "sync")
            }
        } else {
            const template = res as PromptTemplate
            await fragmentExecute(fragment, template.title, template.id)
        }
    }
    const fragmentUnaudited = async (fragment: Fragment) => {
        if (!fragment) return
        await state.markSyncedFragment(fragment, "mod")
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
            "coarch.fragment.prompt",
            fragmentPrompt
        ),
        vscode.commands.registerCommand(
            "coarch.fragment.navigate",
            fragmentNavigate
        ),
        vscode.commands.registerCommand(
            "coarch.fragment.unaudited",
            fragmentUnaudited
        ),
        vscode.commands.registerCommand("coarch.fragment.audit", fragmentAudit)
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
