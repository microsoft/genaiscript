import * as vscode from "vscode"
import { ExtensionState } from "./state"
import {
    CHANGE,
    EMOJI_FAIL,
    EMOJI_SUCCESS,
    ICON_LOGO_NAME,
    PROMPTFOO_CACHE_PATH,
    PROMPTFOO_CONFIG_DIR,
    PROMPTFOO_REMOTE_API_PORT,
    TOOL_ID,
    arrayify,
    errorMessage,
} from "genaiscript-core"
import { PROMPTFOO_VERSION } from "../../cli/src/version"
import { openUrlInTab } from "./browser"

export async function activateTestController(state: ExtensionState) {
    const { context } = state
    const { subscriptions } = context

    const ctrl = vscode.tests.createTestController(TOOL_ID, "GenAIScript")
    subscriptions.push(ctrl)

    // UI button
    ctrl.refreshHandler = async (token) => {
        await state.parseWorkspace()
        if (token?.isCancellationRequested) return
        refreshTests(token)
    }

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
            state.addEventListener(CHANGE, () => refreshTests())
        }
    }

    const refreshTests = async (token?: vscode.CancellationToken) => {
        if (!state.project) await state.parseWorkspace()
        if (token?.isCancellationRequested) return
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
            const tests = new Set<vscode.TestItem>()
            if (include?.length) include.forEach((t) => tests.add(t))
            else ctrl.items.forEach((t) => tests.add(t))
            for (const test of exclude) tests.delete(test)

            // notify ui that the tests are enqueued
            tests.forEach((t) => run.enqueued(t))

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

            const serverUrl = await startTestViewer()
            await state.host.server.client.init()
            try {
                for (const { script, test } of scripts) {
                    // check for cancellation
                    if (token.isCancellationRequested) {
                        run.end()
                        return
                    }
                    run.started(test)
                    const res = await state.host.server.client.runTest(script)
                    for (const r of res.value || []) {
                        run.appendOutput(
                            `${r.ok ? EMOJI_SUCCESS : EMOJI_FAIL} ${r.script} ${errorMessage(r.error) || ""} ${serverUrl}/eval?evalId=${encodeURIComponent(r.value?.evalId)}`,
                            undefined,
                            test
                        )
                    }
                    if (res.error)
                        run.failed(
                            test,
                            new vscode.TestMessage(errorMessage(res.error))
                        )
                    else run.passed(test)
                }
            } finally {
                run.end()
            }
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

async function startTestViewer() {
    const name = "Promptfoo View"
    const port = PROMPTFOO_REMOTE_API_PORT
    const serverUrl = `http://127.0.0.1:${port}`
    if (!vscode.window.terminals.find((t) => t.name === name)) {
        // show results
        const terminal = vscode.window.createTerminal({
            name,
            isTransient: true,
            env: {
                PROMPTFOO_CACHE_PATH,
                PROMPTFOO_CONFIG_DIR,
                PROMPTFOO_DISABLE_TELEMETRY: "1",
                PROMPTFOO_DISABLE_UPDATE: "1",
            },
            iconPath: new vscode.ThemeIcon(ICON_LOGO_NAME),
        })
        const promptfooVersion = PROMPTFOO_VERSION
        terminal.sendText(
            `npx --yes promptfoo@${promptfooVersion} view --port ${port} --no`
        )
    }
    return serverUrl
}
