import * as vscode from "vscode"
import { ExtensionState } from "./state"
import { CHANGE, ICON_LOGO_NAME, TOOL_ID, arrayify } from "genaiscript-core"

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

        if (testToResolve) {
            const script = state.project.templates.find(
                (script) =>
                    vscode.workspace.asRelativePath(script.filename) ===
                    vscode.workspace.asRelativePath(testToResolve.uri)
            )
            await getOrCreateFile(script)
        } else {
            await refreshTests()
            state.addEventListener(CHANGE, refreshTests)
        }
    }

    const refreshTests = async () => {
        if (!state.project) await state.parseWorkspace()
        const scripts =
            state.project.templates.filter((t) => arrayify(t.tests)?.length) ||
            []
        // refresh existing
        for (const script of scripts) {
            getOrCreateFile(script)
        }
        // remove deleted tests
        for (const [id] of Array.from(ctrl.items)) {
            if (!scripts.find((s) => s.id === id)) ctrl.items.delete(id)
        }
    }

    const runProfile = ctrl.createRunProfile(
        "Run",
        vscode.TestRunProfileKind.Run,
        async (request, token) => {
            const { include = [], exclude = [] } = request
            const run = ctrl.createTestRun(request)

            // collect tests
            const tests = new Set<vscode.TestItem>(include)
            for (const test of exclude) tests.delete(test)

            // collect scripts
            const project = state.project
            if (!state.project) await state.parseWorkspace()

            const scripts = Array.from(tests)
                .map((test) => ({
                    test,
                    script: project.templates.find((s) => s.id === test.id),
                }))
                .filter(({ script }) => script)

            if (!scripts.length) {
                run.end()
                return
            }

            startTestViewer()
            await state.host.server.client.init()
            for (const { script, test } of scripts) {
                // check for cancellation
                if (token.isCancellationRequested) {
                    run.end()
                    return
                }
                run.started(test)
                const res = await state.host.server.client.runTest(script)
                if (res.ok) run.passed(test)
                else
                    run.failed(
                        test,
                        new vscode.TestMessage(res.error?.message ?? "error")
                    )
            }
            run.end()
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
        ctrl.items.add(file)
        return file
    }
}

export async function startTestViewer() {
    const name = "Promptfoo View"
    if (vscode.window.terminals.find((t) => t.name === name)) {
        await vscode.env.openExternal(
            vscode.Uri.parse("http://localhost:15500")
        )
    } else {
        // show results
        const terminal = vscode.window.createTerminal({
            name,
            isTransient: true,
            env: {
                PROMPTFOO_DISABLE_TELEMETRY: "1",
                PROMPTFOO_DISABLE_UPDATE: "1",
            },
            iconPath: new vscode.ThemeIcon(ICON_LOGO_NAME),
        })
        terminal.sendText(`npx --yes promptfoo@latest view -y`)
    }
}
