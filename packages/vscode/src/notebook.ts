import * as vscode from "vscode"
import { ExtensionState } from "./state"
import { errorMessage, MARKDOWN_MIME_TYPE, TOOL_NAME } from "genaiscript-core"

const NOTEBOOK_ID = "genaiscript"
const NOTEBOOK_TYPE = "interactive"

export async function activateNotebook(state: ExtensionState) {
    const { context } = state
    const { subscriptions } = context

    const controller = vscode.notebooks.createNotebookController(
        NOTEBOOK_ID,
        NOTEBOOK_TYPE,
        TOOL_NAME
    )
    subscriptions.push(controller)
    controller.supportedLanguages = ["javascript"]
    controller.supportsExecutionOrder = true
    controller.description = "GenAIScript interactive notebook"

    let executionOrder = 0
    controller.executeHandler = async (cells, notebook) => {
        for (const cell of cells) {
            const execution = controller.createNotebookCellExecution(cell)
            execution.executionOrder = executionOrder++
            try {
                execution.start(Date.now())

                const source = cell.document.getText()
                // call LLM
                execution.replaceOutput([
                    new vscode.NotebookCellOutput([
                        vscode.NotebookCellOutputItem.text(
                            source,
                            MARKDOWN_MIME_TYPE
                        ),
                    ]),
                ])
                execution.end(true, Date.now())
            } catch (e) {
                execution.replaceOutput([
                    new vscode.NotebookCellOutput([
                        vscode.NotebookCellOutputItem.error({
                            name: e?.name || "Error",
                            message: errorMessage(e),
                        }),
                    ]),
                ])
                execution.end(false, Date.now())
            }
        }
    }
}
