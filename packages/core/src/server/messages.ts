import {
    HighlightResponse,
    ResponseStatus,
    RetreivalQueryOptions,
    RetreivalQueryResponse,
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

export interface RetreivalUpsert extends RequestMessage {
    type: "retreival.upsert"
    filename: string
    content?: string
    mimeType?: string
}

export interface RetreivalSearch extends RequestMessage {
    type: "retreival.search"
    text: string
    options?: RetreivalQueryOptions
    response?: RetreivalSearchResponse
}

export interface RetreivalQuery extends RequestMessage {
    type: "retreival.query"
    text: string
    options?: RetreivalQueryOptions
    response?: RetreivalQueryResponse
}

export interface RetreivalHighlight extends RequestMessage {
    type: "retreival.highlight"
    files: LinkedFile[]
    options?: HighlightOptions
    response?: HighlightResponse
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
    | RetreivalQuery
    | RetreivalOutline
    | RetreivalHighlight
