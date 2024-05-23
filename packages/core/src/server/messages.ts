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

export interface RetrievalVectorClear extends RequestMessage {
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

export interface PromptScriptTestRun extends RequestMessage {
    type: "tests.run"
    scripts?: string[]
    options?: PromptScriptTestRunOptions
}

export interface PromptScriptTestResult extends ResponseStatus {
    script: string
    value?: any /** OutputFile */
}

export interface PromptScriptTestRunResponse extends ResponseStatus {
    value?: PromptScriptTestResult[]
}

export interface ShellCallResponse extends ResponseStatus {
    value: ShellOutput
}

export interface ShellCall extends RequestMessage {
    type: "shell.call"
    command: string
    args: string[]
    options: ShellOptions
    response?: ShellCallResponse
}

export interface ContainerStartResponse extends ResponseStatus {
    id: string
}

export interface ContainerStart extends RequestMessage {
    type: "container.start"
    options: ContainerOptions
    response?: ContainerStartResponse
}

export interface ContainerRemove extends RequestMessage {
    type: "container.remove"
}

export type RequestMessages =
    | ServerKill
    | RetrievalVectorClear
    | RetrievalVectorUpsert
    | RetrievalSearch
    | ServerVersion
    | ParsePdfMessage
    | PromptScriptTestRun
    | ModelsPull
    | ShellCall
    | ContainerStart
    | ContainerRemove
