import * as vscode from "vscode"
import { ExtensionState } from "./state"
import { checkDirectoryExists, checkFileExists } from "./fs"
import { registerCommand } from "./commands"
import { templateGroup } from "../../core/src/ast"
import { GENAI_ANY_REGEX, TOOL_ID, TOOL_NAME } from "../../core/src/constants"
import { NotSupportedError } from "../../core/src/error"
import { promptParameterTypeToJSONSchema } from "../../core/src/parameters"
import { Fragment } from "../../core/src/generation"
import { groupBy, logInfo, logVerbose } from "../../core/src/util"
import { resolveCli } from "./config"
import { YAMLStringify } from "../../core/src/yaml"
import { dotGenaiscriptPath } from "../../core/src/workdir"

type TemplateQuickPickItem = {
    template?: PromptScript
    action?: "create"
} & vscode.QuickPickItem

async function showPromptParametersQuickPicks(
    script: PromptScript
): Promise<PromptParameters> {
    if (!script) return undefined

    const parameters: PromptParameters = {}
    for (const param in script.parameters || {}) {
        const schema = promptParameterTypeToJSONSchema(script.parameters[param])
        switch (schema.type) {
            case "string": {
                let value: string
                const enums = schema.enum
                const uiSuggestions = schema.uiSuggestions
                if (enums?.length) {
                    const res = await vscode.window.showQuickPick(
                        enums.map((e) => ({
                            label: e,
                            description: e,
                        })),
                        {
                            title: `Choose ${schema.title || param} ${schema.description || ""}`,
                            placeHolder: schema.default,
                            canPickMany: false,
                        }
                    )
                    value = res?.label
                } else if (uiSuggestions) {
                    const custom = "Enter a custom value"
                    const res = await vscode.window.showQuickPick(
                        [
                            ...uiSuggestions.map((e) => ({
                                label: e,
                                description: e,
                            })),
                            {
                                label: custom,
                                description:
                                    "Enter a custom value not in the suggestions.",
                            },
                        ],
                        {
                            title: `Choose ${schema.title || param} ${schema.description || ""}`,
                            placeHolder: schema.default,
                            canPickMany: false,
                        }
                    )
                    value = res?.label
                    if (value === custom) {
                        value = await vscode.window.showInputBox({
                            title: `Enter value for ${schema.title || param}`,
                            value: schema.default,
                            prompt: schema.description,
                        })
                    }
                    if (value === undefined) return undefined
                } else {
                    value = await vscode.window.showInputBox({
                        title: `Enter value for ${schema.title || param}`,
                        value: schema.default,
                        prompt: schema.description,
                    })
                }
                if (value === undefined) return undefined
                parameters[param] = value
                break
            }
            case "boolean": {
                const value = await vscode.window.showQuickPick(
                    [{ label: "yes" }, { label: "no" }],
                    {
                        title: `Choose ${schema.title || param} ${schema.description || ""}`,
                        canPickMany: false,
                    }
                )
                if (value === undefined) return undefined
                parameters[param] = value.label === "yes"
                break
            }
            case "integer":
            case "number": {
                const parse = schema.type === "integer" ? parseInt : parseFloat
                const value = await vscode.window.showInputBox({
                    title: `Enter ${schema.type} value for ${schema.title || param}`,
                    value: schema.default?.toString(),
                    prompt: schema.description,
                    validateInput: (v) => {
                        v = v.trim()
                        const x = parse(v)
                        const msg =
                            isNaN(x) || String(x) !== v
                                ? `Enter a valid, finite ${schema.type}`
                                : null
                        return msg
                    },
                })
                if (value === undefined) return undefined
                parameters[param] = parse(value)
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
        const f = state.host.path.resolve(filename.fsPath)
        logVerbose(`find ${f} in ${state.host.projectUri.fsPath}`)
        const scripts = state.project.scripts.filter((p) => !!p.filename)
        const script = scripts.find((p) => {
            const sfp = state.host.path.resolve(host.toUri(p.filename).fsPath)
            logVerbose(`${p.filename} => ${sfp} => ${sfp === f}`)
            return sfp === f
        })

        if (!script) {
            const reportIssue = "Report Issue"
            vscode.window
                .showErrorMessage(
                    `Could not find a GenAIScript ${filename}. This is most likely a bug in GenAIScript.`,
                    "Report Issue"
                )
                .then((cmd) => {
                    if (cmd === reportIssue) {
                        vscode.commands.executeCommand(
                            "genaiscript.openIssueReporter",
                            [`Could not find a GenAIScript issue`]
                        )
                    }
                })
        }

        return script
    }

    const pickTemplate = async (options?: {
        filter?: (p: PromptScript) => boolean
    }) => {
        const { filter = () => true } = options || {}
        const templates = state.project.scripts
            .filter(
                (t) =>
                    !t.isSystem && t.group !== "infrastructure" && !t.unlisted
            )
            .filter(filter)

        const picked = await vscode.window.showQuickPick(
            templatesToQuickPickItems(templates, { create: true }),
            {
                title: `Pick a GenAIScript`,
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

        let scriptId = template?.id
        if (
            fragment instanceof vscode.Uri &&
            GENAI_ANY_REGEX.test(fragment.path)
        ) {
            scriptId = fragment.toString()
            template = findScript(fragment)
            fragment = undefined
            if (template) scriptId = template.id
        }
        fragment = await resolveSpec(fragment)
        if (!scriptId) {
            await state.parseWorkspace()
            const s = await pickTemplate()
            if (!s) return
            scriptId = template?.id
        }

        const parameters = await showPromptParametersQuickPicks(template)
        if (parameters === undefined) return

        await state.requestAI({
            fragment,
            scriptId,
            template,
            label: scriptId,
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
                return
            }
            files = []
        } else {
            template = await pickTemplate()
            if (!template) return
            files = [file]
        }

        const { cliPath, cliVersion } = await resolveCli(state)
        const args = [
            "run",
            vscode.workspace.asRelativePath(template.filename),
            ...files.map((file) =>
                vscode.workspace.asRelativePath(file.fsPath)
            ),
        ]

        const parameters = await showPromptParametersQuickPicks(template)
        if (parameters === undefined) return
        for (const [name, value] of Object.entries(parameters)) {
            args.push(`--vars`, `${name}=${value}`)
        }

        const configuration = cliPath
            ? ((<vscode.DebugConfiguration>{
                  type: "node",
                  name: TOOL_NAME,
                  request: "launch",
                  console: "integratedTerminal",
                  internalConsoleOptions: "neverOpen",
                  skipFiles: ["<node_internals>/**", dotGenaiscriptPath("**")],

                  args: [cliPath, ...args],
              }) satisfies vscode.DebugConfiguration)
            : <vscode.DebugConfiguration>{
                  type: "node",
                  name: TOOL_NAME,
                  request: "launch",
                  console: "integratedTerminal",
                  internalConsoleOptions: "neverOpen",
                  skipFiles: ["<node_internals>/**", dotGenaiscriptPath("**")],

                  runtimeExecutable: "npx",
                  runtimeArgs: [`--yes`, `${TOOL_ID}@${cliVersion}`, ...args],
              }

        logInfo(`start debugging ${YAMLStringify(configuration)}`)
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
            label: "Create a new GenAIScript script...",
            description: "Create a new script script in the current workspace.",
            action: "create",
        })
    }
    return items
}
