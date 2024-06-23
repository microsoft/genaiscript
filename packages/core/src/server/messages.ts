import { GenerationResult } from "../expander"
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
    value?: { evalId: string } /** OutputFile */
}

export interface PromptScriptTestRunResponse extends ResponseStatus {
    value?: PromptScriptTestResult[]
}

export interface PromptScriptRunOptions {
    excludedFiles: string[]
    excludeGitIgnore: boolean
    out: string
    retry: string
    retryDelay: string
    maxDelay: string
    json: boolean
    yaml: boolean
    prompt: boolean
    outTrace: string
    outAnnotations: string
    outChangelogs: string
    pullRequestComment: string | boolean
    pullRequestDescription: string | boolean
    pullRequestReviews: boolean
    outData: string
    label: string
    temperature: string
    topP: string
    seed: string
    maxTokens: string
    maxToolCalls: string
    maxDataRepairs: string
    model: string
    csvSeparator: string
    cache: boolean
    cacheName: string
    applyEdits: boolean
    failOnErrors: boolean
    removeOut: boolean
    vars: string[]
}

export interface PromptScriptStart extends RequestMessage {
    type: "script.start"
    runId: string
    script: string
    files: string[]
    options: PromptScriptRunOptions
}

export interface PromptScriptStartResponse extends ResponseStatus {
    runId: string
}

export interface PromptScriptEndResponseEvent {
    type: "script.end"
    runId: string
    exitCode: number
    result: GenerationResult
}

export interface PromptScriptAbort extends RequestMessage {
    type: "script.abort"
    reason: string
    runId: string
}

export interface PromptScriptProgressResponseEvent {
    type: "script.progress"
    runId: string

    trace?: string

    progress?: string

    tokens?: number
    response?: string
    responseChunk?: string
}

export interface ShellExecResponse extends ResponseStatus {
    value: ShellOutput
}

export interface ShellExec extends RequestMessage {
    type: "shell.exec"
    containerId?: string
    command: string
    args: string[]
    options: ShellOptions
    response?: ShellExecResponse
}

export interface ContainerStartResponse extends ResponseStatus {
    id: string
    disablePurge: boolean
    hostPath: string
    containerPath: string
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
    | ShellExec
    | ContainerStart
    | ContainerRemove
    | PromptScriptStart
    | PromptScriptAbort

export type ResponseEvents =
    | PromptScriptProgressResponseEvent
    | PromptScriptEndResponseEvent
