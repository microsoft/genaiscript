import * as vscode from "vscode"
import { ExtensionState } from "./state"
import { TOOL_ID, TOOL_NAME } from "../../core/src/constants"

export function activateComments(state: ExtensionState) {
    const { context } = state
    const { subscriptions } = context

    const controller = vscode.comments.createCommentController(
        TOOL_ID,
        `${TOOL_NAME} comments`
    )
    subscriptions.push(controller)
}
