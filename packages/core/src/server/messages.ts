import {
    ParsePdfResponse,
    ResponseStatus,
    RetrievalOptions,
    RetrievalSearchOptions,
    RetrievalSearchResponse,
    RetrievalUpsertOptions,
} from "../host"

export interface RequestMessage {
    type: string
    id: string
    response?: ResponseStatus
}

export interface ServerKill extends RequestMessage {
    type: "server.kill"
}

export interface RetrievalClear extends RequestMessage {
    type: "retrieval.clear"
    options?: RetrievalOptions
}

export interface ServerVersion extends RequestMessage {
    type: "server.version"
    version?: string
}

export interface RetrievalUpsert extends RequestMessage {
    type: "retrieval.upsert"
    filename: string
    options?: RetrievalUpsertOptions
}

export interface RetrievalSearch extends RequestMessage {
    type: "retrieval.search"
    text: string
    options?: RetrievalSearchOptions
    response?: RetrievalSearchResponse
}

export interface ParsePdfMessage extends RequestMessage {
    type: "parse.pdf"
    filename: string
    response?: ParsePdfResponse
}

export interface TestRunOptions {
    testProvider?: string
    models?: string[]
}

export interface TestRunMessage extends RequestMessage {
    type: "tests.run"
    scripts?: string[]
    options?: TestRunOptions
}

export type RequestMessages =
    | ServerKill
    | RetrievalClear
    | RetrievalUpsert
    | RetrievalSearch
    | ServerVersion
    | ParsePdfMessage
    | TestRunMessage
