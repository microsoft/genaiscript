import * as vscode from "vscode"
import { ExtensionState } from "./state"
import { registerCommand } from "./commands"
import { Utils } from "vscode-uri"
import { GENAI_SRC } from "../../core/src/constants"
import { parsePromptScriptMeta } from "../../core/src/template"
import { writeFile } from "./fs"

export function activateSamplesCommands(state: ExtensionState) {
    const { context, host } = state

    registerCommand("genaiscript.samples.download", async (name: string) => {
        const dir = Utils.joinPath(context.extensionUri, GENAI_SRC)
        const files = await vscode.workspace.fs.readDirectory(
            Utils.joinPath(context.extensionUri, GENAI_SRC)
        )
        const utf8 = host.createUTF8Decoder()
        const samples = (
            await Promise.all(
                files
                    .map((f) => f[0])
                    .filter((f) => f.endsWith(".genai.mts"))
                    .map(async (filename) => ({
                        filename,
                        jsSource: utf8.decode(
                            await vscode.workspace.fs.readFile(
                                Utils.joinPath(dir, filename)
                            )
                        ),
                    }))
            )
        ).map((s) => ({ ...s, meta: parsePromptScriptMeta(s.jsSource) }))

        const res =
            samples.find((s) => s.filename === name) ||
            (await vscode.window.showQuickPick<
                vscode.QuickPickItem & { filename: string; jsSource: string }
            >(
                samples.map((s) => ({
                    label: s.meta.title,
                    detail: s.meta.description,
                    ...s,
                })),
                { title: "Pick a sample to download" }
            ))
        if (res === undefined) return

        const { jsSource, filename } = res
        await writeFile(host.toUri(GENAI_SRC), filename, jsSource, {
            open: true,
        })
        await state.parseWorkspace()
    })
}
