import * as vscode from "vscode"
import { ExtensionState } from "./state"
import { eolPosition } from "../../core/src/ast"

export function toPos(p: CharPosition | number) {
    if (typeof p === "number") return new vscode.Position(p, 0)
    return new vscode.Position(...p)
}
export function toRange(p: CharRange | LineRange) {
    if (!p) return undefined
    if (
        Array.isArray(p) &&
        typeof p[0] === "number" &&
        typeof p[1] === "number"
    )
        return new vscode.Range(
            new vscode.Position(p[0], 0),
            new vscode.Position(p[1], eolPosition)
        )
    return new vscode.Range(toPos(p[0]), toPos(p[1]))
}

export async function applyEdits(
    state: ExtensionState,
    edits: Edits[],
    options?: {
        needsConfirmation?: boolean
    }
) {
    if (!edits?.length) return true

    const { needsConfirmation } = options || {}
    const edit = new vscode.WorkspaceEdit()
    for (const e of edits) {
        const uri = state.host.toUri(e.filename)
        const meta: vscode.WorkspaceEditEntryMetadata = {
            label: e.label,
            needsConfirmation: false,
        }
        switch (e.type) {
            case "insert":
                edit.insert(uri, toPos(e.pos), e.text, meta)
                break
            case "delete":
                edit.delete(uri, toRange(e.range), meta)
                break
            case "replace":
                edit.replace(uri, toRange(e.range), e.text, meta)
                break
            case "createfile":
                // first create, then update, otherwise it doesn't show up in the preview correctly
                edit.createFile(
                    uri,
                    {
                        ignoreIfExists: e.ignoreIfExists,
                        overwrite: e.overwrite,
                    },
                    meta
                )
                edit.replace(
                    uri,
                    toRange([
                        [0, 0],
                        [0, 0],
                    ]),
                    e.text
                )
                break
        }
    }
    if (needsConfirmation)
        edit.insert(state.host.toUri(edits[0].filename), toPos([0, 0]), "", {
            label: "Fake edit",
            needsConfirmation: true,
        })
    return await vscode.workspace.applyEdit(edit, {
        isRefactoring: true,
    })
}
