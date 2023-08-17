import { Position, Range } from "./ast"

export interface Edit {
    type: string
    filename: string
    label: string
}

export interface InsertEdit extends Edit {
    type: "insert"
    pos: Position
    text: string
}

export interface ReplaceEdit extends Edit {
    type: "replace"
    range: Range
    text: string
}

export interface DeleteEdit extends Edit {
    type: "delete"
    range: Range
}

export interface CreateFileEdit extends Edit {
    type: "createfile"
    overwrite?: boolean
    ignoreIfExists?: boolean
    text: string
}

export type Edits = InsertEdit | ReplaceEdit | DeleteEdit | CreateFileEdit
