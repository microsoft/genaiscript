import {
    HighlightResponse,
    ResponseStatus,
    RetreivalSearchOptions,
    RetreivalSearchResponse,
} from "../host"

export interface RequestMessage {
    type: string
    id: string
    response?: ResponseStatus
}

export interface ServerKill extends RequestMessage {
    type: "server.kill"
}

export interface RetreivalClear extends RequestMessage {
    type: "retreival.clear"
}

export interface ServerVersion extends RequestMessage {
    type: "server.version"
    version?: string
}

export interface RetreivalUpsert extends RequestMessage {
    type: "retreival.upsert"
    filename: string
    content?: string
    mimeType?: string
}

export interface RetreivalSearch extends RequestMessage {
    type: "retreival.search"
    text: string
    options?: RetreivalSearchOptions
    response?: RetreivalSearchResponse
}

export interface RetreivalOutline extends RequestMessage {
    type: "retreival.outline"
    files: LinkedFile[]
    response?: HighlightResponse
}

export type RequestMessages =
    | ServerKill
    | RetreivalClear
    | RetreivalUpsert
    | RetreivalSearch
    | RetreivalOutline
    | ServerVersion
