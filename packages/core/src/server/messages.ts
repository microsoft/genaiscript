import {
    ParsePdfResponse,
    ResponseStatus,
    RetrievalSearchOptions,
    RetrievalSearchResponse,
    RetrievalUpsertOptions as RetrievalVectorUpsertOptions,
} from "../host"

export interface RequestMessage {
    type: string
    id: string
    response?: ResponseStatus
}

export interface ServerKill extends RequestMessage {
    type: "server.kill"
}

export interface ModelsPull extends RequestMessage {
    type: "models.pull"
    model: string
}

export interface RetrievaVectorClear extends RequestMessage {
    type: "retrieval.vectorClear"
    options?: VectorSearchOptions
}

export interface ServerVersion extends RequestMessage {
    type: "server.version"
    version?: string
}

export interface RetrievalVectorUpsert extends RequestMessage {
    type: "retrieval.vectorUpsert"
    filename: string
    options?: RetrievalVectorUpsertOptions
}

export interface RetrievalSearch extends RequestMessage {
    type: "retrieval.vectorSearch"
    text: string
    options?: RetrievalSearchOptions
    response?: RetrievalSearchResponse
}

export interface ParsePdfMessage extends RequestMessage {
    type: "parse.pdf"
    filename: string
    response?: ParsePdfResponse
}

export interface PromptScriptTestRunOptions {
    testProvider?: string
    models?: string[]
}

export interface PromptScriptTestRunMessage extends RequestMessage {
    type: "tests.run"
    scripts?: string[]
    options?: PromptScriptTestRunOptions
    response?: any
}

export type RequestMessages =
    | ServerKill
    | RetrievaVectorClear
    | RetrievalVectorUpsert
    | RetrievalSearch
    | ServerVersion
    | ParsePdfMessage
    | PromptScriptTestRunMessage
    | ModelsPull
