import * as vscode from "vscode"
import { ExtensionState } from "./state"
import {
    details,
    fenceMD,
    Fragment,
    fromHex,
    MARKDOWN_MIME_TYPE,
    stringToPos,
    TextFile,
    toHex,
    TOOL_NAME,
    YAML_MIME_TYPE,
    YAMLStringify,
} from "genaiscript-core"

const NOTEBOOK_ID = "genaiscript"
const NOTEBOOK_TYPE = "genaiscript"

interface GenAINotebookCell {
    type: "code" | "markdown"
    source: string
    outputs?: {
        items: {
            mime: string
            data: string
        }[]
    }[]
}

interface GenAINotebook {
    cells: GenAINotebookCell[]
}

export async function activateNotebook(state: ExtensionState) {
    const { context } = state
    const { subscriptions } = context
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const controller = vscode.notebooks.createNotebookController(
        NOTEBOOK_ID,
        NOTEBOOK_TYPE,
        TOOL_NAME
    )
    subscriptions.push(controller)
    controller.supportedLanguages = ["javascript"]
    controller.supportsExecutionOrder = true
    controller.description = "GenAIScript interactive notebook"

    const env: Record<string, object> = {}
    let executionId = 0
    let executionOrder = 0
    controller.interruptHandler = async () => {
        executionId++
        await state.cancelAiRequest()
    }
    controller.executeHandler = async (cells, notebook) => {
        const currentExecutionId = executionId
        await state.cancelAiRequest()
        await state.parseWorkspace()
        const project = state.project
        for (const cell of cells) {
            if (executionId !== currentExecutionId) return
            const execution = controller.createNotebookCellExecution(cell)
            execution.executionOrder = executionOrder++
            try {
                execution.start(Date.now())
                execution.clearOutput()
                const jsSource = cell.document.getText()
                const template: PromptScript = {
                    id: "notebook-cell-" + cell.index,
                    jsSource,
                }
                const fragment: Fragment = {
                    id: "notebook-cell-" + cell.index,
                    text: "",
                    references: [],
                    fullId: "",
                    title: "",
                    hash: "",
                    file: new TextFile(
                        project,
                        "notebook.cell." + cell.index + ".txt",
                        "text/plain",
                        ""
                    ),
                    startPos: [0, 0],
                    endPos: stringToPos(""),
                }
                await state.requestAI({
                    template,
                    label: "Executing cell",
                    parameters: env,
                    fragment,
                    notebook: true,
                })
                const res = state.aiRequest?.response
                if (!res) throw new Error("No GenAI result")

                const {
                    text,
                    fileEdits,
                    changelogs,
                    annotations,
                    edits,
                    fences,
                    frames,
                    schemas,
                    trace,
                } = res
                const output = {
                    text,
                    fileEdits,
                    changelogs,
                    annotations,
                    edits,
                    fences,
                    frames,
                    schemas,
                }
                env.output = output

                // call LLM
                await execution.replaceOutput([
                    new vscode.NotebookCellOutput([
                        vscode.NotebookCellOutputItem.text(
                            res.text,
                            MARKDOWN_MIME_TYPE
                        ),
                    ]),
                    new vscode.NotebookCellOutput([
                        vscode.NotebookCellOutputItem.text(
                            details(
                                "env.vars.output",
                                fenceMD(YAMLStringify(output), "yaml")
                            ) + details("trace", trace),
                            MARKDOWN_MIME_TYPE
                        ),
                    ]),
                ])
                execution.end(true, Date.now())
            } catch (e) {
                await execution.replaceOutput([
                    new vscode.NotebookCellOutput([
                        vscode.NotebookCellOutputItem.error(e),
                    ]),
                ])
                execution.end(false, Date.now())
            }
        }
    }

    subscriptions.push(
        vscode.workspace.registerNotebookSerializer(
            NOTEBOOK_TYPE,
            {
                deserializeNotebook: function (
                    content: Uint8Array,
                    token: vscode.CancellationToken
                ): vscode.NotebookData | Thenable<vscode.NotebookData> {
                    const contents = decoder.decode(content)

                    let raw: GenAINotebookCell[]
                    try {
                        raw = (<GenAINotebook>JSON.parse(contents)).cells
                    } catch {
                        raw = []
                    }

                    const cells = raw.map((item) => {
                        const data = new vscode.NotebookCellData(
                            item.type === "code"
                                ? vscode.NotebookCellKind.Code
                                : vscode.NotebookCellKind.Markup,
                            item.source,
                            item.type === "code" ? "javascript" : "markdown"
                        )
                        if (item.outputs?.length)
                            data.outputs = item.outputs.map(
                                (o) =>
                                    new vscode.NotebookCellOutput(
                                        o.items.map(
                                            (i) =>
                                                new vscode.NotebookCellOutputItem(
                                                    fromHex(i.data),
                                                    i.mime
                                                )
                                        )
                                    )
                            )
                        return data
                    })

                    return new vscode.NotebookData(cells)
                },
                serializeNotebook: function (
                    data: vscode.NotebookData,
                    token: vscode.CancellationToken
                ): Uint8Array | Thenable<Uint8Array> {
                    const contents: GenAINotebookCell[] = []
                    for (const cell of data.cells) {
                        contents.push({
                            type:
                                cell.kind === vscode.NotebookCellKind.Code
                                    ? "code"
                                    : "markdown",
                            source: cell.value,
                            outputs: cell.outputs?.map((o) => ({
                                items: o.items.map((i) => ({
                                    mime: i.mime,
                                    data: toHex(i.data),
                                })),
                            })),
                        })
                    }
                    return encoder.encode(
                        JSON.stringify({ cells: contents }, null, 2)
                    )
                },
            },
            { transientOutputs: false }
        )
    )

    subscriptions.push(
        vscode.commands.registerCommand(
            "genaiscript.notebook.new",
            async () => {
                const newNotebook = await vscode.workspace.openNotebookDocument(
                    NOTEBOOK_TYPE,
                    new vscode.NotebookData([
                        new vscode.NotebookCellData(
                            vscode.NotebookCellKind.Code,
                            "$`Write a poem`",
                            "javascript"
                        ),
                    ])
                )
                await vscode.commands.executeCommand(
                    "vscode.openWith",
                    newNotebook.uri,
                    NOTEBOOK_TYPE
                )
            }
        )
    )
}
