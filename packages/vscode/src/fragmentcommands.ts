import * as vscode from "vscode"
import { ExtensionState } from "./state"
import { checkDirectoryExists, checkFileExists } from "./fs"
import { registerCommand } from "./commands"
import { templateGroup } from "../../core/src/ast"
import { GENAI_ANY_REGEX, TOOL_ID, TOOL_NAME } from "../../core/src/constants"
import { NotSupportedError } from "../../core/src/error"
import { promptParameterTypeToJSONSchema } from "../../core/src/parameters"
import { Fragment } from "../../core/src/generation"
import { assert, dotGenaiscriptPath, groupBy } from "../../core/src/util"
import { resolveCli } from "./config"

type TemplateQuickPickItem = {
    template?: PromptScript
    action?: "create"
} & vscode.QuickPickItem

async function showPromptParametersQuickPicks(
    template: PromptScript
): Promise<PromptParameters> {
    const parameters: PromptParameters = {}
    for (const param in template.parameters || {}) {
        const schema = promptParameterTypeToJSONSchema(
            template.parameters[param]
        )
        switch (schema.type) {
            case "string": {
                const value = await vscode.window.showInputBox({
                    title: `Enter value for ${param}`,
                    value: schema.default,
                    prompt: schema.description,
                })
                if (value === undefined) return undefined
                parameters[param] = value
                break
            }
            case "boolean": {
                const value = await vscode.window.showQuickPick(
                    [{ label: "yes" }, { label: "no" }],
                    {
                        title: `Choose ${param} ${schema.description || ""}`,
                        canPickMany: false,
                    }
                )
                if (value === undefined) return undefined
                parameters[param] = value.label === "yes"
                break
            }
            case "number": {
                const value = await vscode.window.showInputBox({
                    title: `Enter value for ${param}`,
                    value: schema.default?.toLocaleString(),
                    prompt: schema.description,
                    validateInput: (v) =>
                        isNaN(parseFloat(v))
                            ? "Enter a valid number"
                            : undefined,
                })
                if (value === undefined) return undefined
                parameters[param] = parseFloat(value)
                break
            }
            default:
                throw new NotSupportedError(
                    "Unsupported parameter type " + schema.type
                )
        }
    }
    return parameters
}

export function activateFragmentCommands(state: ExtensionState) {
    const { context, host } = state
    const { subscriptions } = context

    const findScript = (filename: vscode.Uri) => {
        const fsPath = state.host.path.resolve(filename.fsPath)
        return state.project.scripts
            .filter((p) => !!p.filename)
            .find(
                (p) =>
                    state.host.path.resolve(
                        state.host.projectFolder(),
                        p.filename
                    ) === fsPath
            )
    }

    const pickTemplate = async (options?: {
        filter?: (p: PromptScript) => boolean
    }) => {
        const { filter = () => true } = options || {}
        const templates = state.project.scripts
            .filter((t) => !t.isSystem && t.group !== "infrastructure")
            .filter(filter)

        const picked = await vscode.window.showQuickPick(
            templatesToQuickPickItems(templates, { create: true }),
            {
                title: `Pick a GenAiScript`,
            }
        )
        if (picked?.action === "create") {
            vscode.commands.executeCommand("genaiscript.prompt.create")
            return undefined
        } else return (picked as TemplateQuickPickItem)?.template
    }

    const resolveSpec = async (frag: Fragment | string | vscode.Uri) => {
        let fragment: Fragment
        // active text editor
        if (frag === undefined && vscode.window.activeTextEditor) {
            const document = vscode.window.activeTextEditor.document
            if (
                document &&
                document.uri.scheme === "file" &&
                !GENAI_ANY_REGEX.test(document.fileName)
            )
                frag = document.uri.fsPath
        }
        if (frag instanceof vscode.Uri) frag = frag.fsPath
        if (typeof frag === "string") {
            const fragUri = host.toUri(frag)
            if (await checkFileExists(fragUri)) {
                fragment = await state.parseDocument(fragUri)
            } else if (await checkDirectoryExists(fragUri)) {
                fragment = await state.parseDirectory(fragUri)
            }
        } else {
            fragment = frag
        }
        return fragment
    }

    const fragmentPrompt = async (
        options:
            | {
                  fragment?: Fragment | string | vscode.Uri
                  template?: PromptScript
              }
            | vscode.Uri
    ) => {
        if (typeof options === "object" && options instanceof vscode.Uri)
            options = { fragment: options }
        let { fragment, template } = options || {}

        await state.cancelAiRequest()
        await state.parseWorkspace()

        if (
            fragment instanceof vscode.Uri &&
            GENAI_ANY_REGEX.test(fragment.path)
        ) {
            template = findScript(fragment)
            if (!template) {
                vscode.window.showErrorMessage(
                    `Could not find a GenAiScript ${fragment.fsPath}. This is most likely a bug in GenAIScript.`
                )
                return
            }
            fragment = undefined
        }
        fragment = await resolveSpec(fragment)
        if (!template) {
            template = await pickTemplate()
            if (!template) return
        }

        const parameters = await showPromptParametersQuickPicks(template)
        if (parameters === undefined) return

        await state.requestAI({
            fragment,
            template,
            label: template.id,
            parameters,
        })
    }

    const fragmentDebug = async (file: vscode.Uri) => {
        if (!file) return
        await state.cancelAiRequest()
        await state.parseWorkspace()

        let template: PromptScript
        let files: vscode.Uri[]
        if (GENAI_ANY_REGEX.test(file.path)) {
            template = findScript(file)
            if (!template) {
                vscode.window.showErrorMessage(
                    `Could not find a GenAiScript ${file.fsPath}. This is most likely a bug in GenAIScript.`
                )
                return
            }
            files = vscode.window.visibleTextEditors
                .filter((editor) => editor.document.uri.fsPath !== file.fsPath)
                .map((editor) => editor.document.uri)
        } else {
            template = await pickTemplate()
            files = [file]
        }

        const { cliPath, cliVersion } = await resolveCli()
        const args = [
            "run",
            vscode.workspace.asRelativePath(template.filename),
            ...files.map((file) =>
                vscode.workspace.asRelativePath(file.fsPath)
            ),
        ]
        const configuration = cliPath
            ? <vscode.DebugConfiguration>{
                  name: TOOL_NAME,
                  request: "launch",
                  skipFiles: ["<node_internals>/**", dotGenaiscriptPath("**")],
                  type: "node",
                  args: [cliPath, ...args],
              }
            : <vscode.DebugConfiguration>{
                  name: TOOL_NAME,
                  type: "node",
                  request: "launch",
                  runtimeExecutable: "npx",
                  runtimeArgs: [`--yes`, `${TOOL_ID}@${cliVersion}`, ...args],
                  console: "integratedTerminal",
                  internalConsoleOptions: "neverOpen",
              }

        await vscode.debug.startDebugging(
            vscode.workspace.workspaceFolders[0],
            configuration
        )
    }

    subscriptions.push(
        registerCommand("genaiscript.fragment.prompt", fragmentPrompt),
        registerCommand("genaiscript.fragment.debug", fragmentDebug)
    )
}

export function templatesToQuickPickItems(
    templates: globalThis.PromptScript[],
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
                        label:
                            template.title ??
                            (template.filename &&
                                vscode.workspace.asRelativePath(
                                    template.filename
                                )) ??
                            template.id,
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
