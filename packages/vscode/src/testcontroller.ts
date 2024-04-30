import * as vscode from "vscode"
import { ExtensionState } from "./state"
import { TOOL_ID, arrayify } from "genaiscript-core"

export async function activateTestController(state: ExtensionState) {
    const { context } = state
    const { subscriptions } = context

    const testData = new WeakMap<
        vscode.TestItem,
        {
            script: PromptScript
            index: number
        }
    >()
    const ctrl = vscode.tests.createTestController(TOOL_ID, "GenAIScript")
    subscriptions.push(ctrl)

    // First, create the `resolveHandler`. This may initially be called with
    // "undefined" to ask for all tests in the workspace to be discovered, usually
    // when the user opens the Test Explorer for the first time.
    ctrl.resolveHandler = async (testToResolve) => {
        if (!vscode.workspace.workspaceFolders) return // handle the case of no open folders

        if (!state.project) await state.parseWorkspace()
        if (testToResolve) {
            const script = state.project.templates.find(
                (script) =>
                    vscode.workspace.asRelativePath(script.filename) ===
                    vscode.workspace.asRelativePath(testToResolve.uri)
            )
            const file = await getOrCreateFile(script)
            // TODO
        } else {
            const scripts = state.project.templates.filter(
                (t) => arrayify(t.tests)?.length
            )
            for (const script of scripts) {
                const file = getOrCreateFile(script)
                const tests = arrayify(script.tests).map((t, index) => {
                    const id = `${script.id}:${index}`
                    const test =
                        ctrl.items.get(id) ??
                        ctrl.createTestItem(
                            id,
                            t.description ?? `test ${index}`,
                            vscode.Uri.file(script.filename)
                        )
                    test.description = arrayify(t.files).join(", ")
                    testData.set(test, { script, index })
                    return test
                })
                file.children.replace(tests)
            }
        }
    }

    const runProfile = ctrl.createRunProfile(
        "Run",
        vscode.TestRunProfileKind.Run,
        (request, token) => {
            console.log("run")
        }
    )
    subscriptions.push(runProfile)

    function getOrCreateFile(script: PromptScript) {
        const existing = ctrl.items.get(script.id)
        if (existing) return existing

        const file = ctrl.createTestItem(
            script.id,
            script.id,
            vscode.Uri.file(script.filename)
        )
        file.description = script.title ?? script.description
        file.canResolveChildren = true
        ctrl.items.add(file)
        return file
    }
}
