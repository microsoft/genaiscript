import * as vscode from "vscode"
import { ExtensionState } from "./state"
import { COMMENTS_CACHE, TOOL_ID, TOOL_NAME } from "../../core/src/constants"
import { JSONLineCache } from "../../core/src/cache"
import { toRange } from "./edit"

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
    const cache = JSONLineCache.byName<CommentKey, CommentValue>(COMMENTS_CACHE)

    vscode.workspace.onDidChangeWorkspaceFolders(async () => {
        const entries = await cache.entries()
        for (const { val } of entries) {
            const { uri, range, comments, label, resolved } = val
            const thread = controller.createCommentThread(
                vscode.Uri.parse(uri),
                toRange(range),
                comments.map(commentToVSCodeComment)
            )
            thread.label = val.label
            thread.canReply = true
            thread.state = resolved
                ? vscode.CommentThreadState.Resolved
                : vscode.CommentThreadState.Unresolved
        }
    })
}
