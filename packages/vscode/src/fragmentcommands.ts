import * as vscode from "vscode"
import { ExtensionState } from "./state"
import { checkDirectoryExists, checkFileExists } from "./fs"
import { registerCommand } from "./commands"
import { GENAI_ANY_REGEX, TOOL_ID, TOOL_NAME } from "../../core/src/constants"
import { Fragment } from "../../core/src/generation"
import { assert, logInfo, logVerbose } from "../../core/src/util"
import { resolveCli } from "./config"
import { YAMLStringify } from "../../core/src/yaml"
import { dotGenaiscriptPath } from "../../core/src/workdir"
import {
    TemplateQuickPickItem,
    showPromptParametersQuickPicks,
} from "./parameterquickpick"
import { scriptsToQuickPickItems } from "./scriptquickpick"

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
            scriptsToQuickPickItems(templates, { create: true }),
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
        await state.parseWorkspace()

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
            scriptId = s.id
        }

        // TODO
        const parameters = await showPromptParametersQuickPicks(template)
        if (parameters === undefined) return

        assert(!!scriptId, "scriptId is required")
        await state.requestAI({
            fragment,
            scriptId,
            label: scriptId,
            parameters,
        })
    }

    const fragmentDebug = async (file: vscode.Uri) => {
        if (!file) return
        await state.cancelAiRequest()
        await state.parseWorkspace()

        let script: PromptScript
        let files: vscode.Uri[]
        if (GENAI_ANY_REGEX.test(file.path)) {
            script = findScript(file)
            if (!script) {
                return
            }
            files = []
        } else {
            script = await pickTemplate()
            if (!script) return
            files = [file]
        }
        const parameters = await showPromptParametersQuickPicks(script)
        if (parameters === undefined) return

        const { cliPath, cliVersion } = await resolveCli(state)
        const args = [
            "run",
            vscode.workspace.asRelativePath(script.filename),
            ...files.map((file) =>
                vscode.workspace.asRelativePath(file.fsPath)
            ),
        ]
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
