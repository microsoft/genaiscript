import { ResponseStatus, RetreivalSearchResponse } from "../host"

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
    content: string
    mimeType: string
}

export interface RetreivalSearch extends RequestMessage {
    type: "retreival.search"
    text: string
    response?: RetreivalSearchResponse
}

export type RequestMessages =
    | ServerKill
    | RetreivalClear
    | RetreivalUpsert
    | RetreivalSearch
