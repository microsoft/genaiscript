import * as vscode from "vscode"
import { Edits, Position, Range, Fragment } from "gptools-core"

export function toPos(p: Position) {
    return new vscode.Position(...p)
}
export function toRange(p: Range) {
    return new vscode.Range(toPos(p[0]), toPos(p[1]))
}
export function fragmentRange(frag: Fragment) {
    const start = toPos(frag.startPos)
    const end = toPos(frag.endPos)
    return new vscode.Range(start, end)
}

export async function applyEdits(
    edits: Edits[],
    options?: {
        needsConfirmation?: boolean
    }
) {
    if (!edits?.length) return true

    const { needsConfirmation } = options || {}
    const edit = new vscode.WorkspaceEdit()
    for (const e of edits) {
        const uri = vscode.Uri.file(e.filename)
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
        edit.insert(vscode.Uri.file(edits[0].filename), toPos([0, 0]), "", {
            label: "Fake edit",
            needsConfirmation: true,
        })
    return await vscode.workspace.applyEdit(edit, {
        isRefactoring: true,
    })
}
