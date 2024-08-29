import * as vscode from "vscode"
import { ExtensionState } from "./state"
import { TOOL_ID, TOOL_NAME } from "../../core/src/constants"
import { toRange } from "./edit"
import { commentsCache } from "../../core/src/comments"

export interface CommentKey {}

export interface CommentValue {
    uri: string
    source: string
    range: [number, number]
    comments: Comment[]
    label?: string
    resolved?: boolean
}

function commentToVSCodeComment(comment: Comment): vscode.Comment {
    const { reactions, timestamp, ...rest } = comment
    return {
        ...rest,
        timestamp: new Date(timestamp),
        reactions: reactions.map((r) => ({ ...r, iconPath: "" })),
        mode: vscode.CommentMode.Preview,
    }
}

export function activateComments(state: ExtensionState) {
    const { context } = state
    const { subscriptions } = context

    const controller = vscode.comments.createCommentController(
        TOOL_ID,
        `${TOOL_NAME} comments`
    )
    subscriptions.push(controller)
    const cache = commentsCache()

    vscode.workspace.onDidChangeWorkspaceFolders(async () => {
        const entries = await cache.entries()
        for (const { val } of entries) {
            const { filename, line, comments, label, resolved } = val
            const thread = controller.createCommentThread(
                state.host.toUri(filename),
                toRange([line, line]),
                comments.map(commentToVSCodeComment)
            )
            thread.label = label
            thread.canReply = true
            thread.state = resolved
                ? vscode.CommentThreadState.Resolved
                : vscode.CommentThreadState.Unresolved
        }
    })
}
