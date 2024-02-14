import { ResponseStatus, RetreivalSearchResponse } from "../host"

export interface RequestMessage {
    type: string
    id: string
    response?: ResponseStatus
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

export type RequestMessages = RetreivalClear | RetreivalUpsert | RetreivalSearch