import {
    HighlightResponse,
    ResponseStatus,
    RetreivalOptions,
    RetreivalSearchOptions,
    RetreivalSearchResponse,
    RetreivalUpsertOptions,
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
    options?: RetreivalOptions
}

export interface ServerVersion extends RequestMessage {
    type: "server.version"
    version?: string
}

export interface RetreivalUpsert extends RequestMessage {
    type: "retreival.upsert"
    filename: string
    options?: RetreivalUpsertOptions
}

export interface RetreivalSearch extends RequestMessage {
    type: "retreival.search"
    text: string
    options?: RetreivalSearchOptions
    response?: RetreivalSearchResponse
}

export type RequestMessages =
    | ServerKill
    | RetreivalClear
    | RetreivalUpsert
    | RetreivalSearch
    | ServerVersion
