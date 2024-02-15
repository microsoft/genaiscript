import {
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

export interface RetreivalFileOutline extends RequestMessage {
    type: "retreival.highlights.file"
    files: string[]
    response: ResponseStatus & { content: string }
}
export interface RetreivalCodeOutline extends RequestMessage {
    type: "retreival.highlights.code"
    files: string[]
    response: ResponseStatus & { content: string }
}

export type RequestMessages =
    | ServerKill
    | RetreivalClear
    | RetreivalUpsert
    | RetreivalSearch
    | RetreivalQuery
    | RetreivalFileOutline
    | RetreivalCodeOutline
