import { ChatCompletionAssistantMessageParam } from "../chattypes"
import { GenerationResult } from "../generation"
import { ResponseStatus } from "../host"

export interface RequestMessage {
    type: string
    id: string
    response?: ResponseStatus
}

export interface ServerKill extends RequestMessage {
    type: "server.kill"
}

export interface ServerVersion extends RequestMessage {
    type: "server.version"
    version?: string
}

export interface ServerEnv extends RequestMessage {
    type: "server.env"
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
    embeddingsModel: string
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
    files?: string[]
    options: Partial<PromptScriptRunOptions>
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

export interface ChatStart {
    type: "chat.start"
    chatId: string
    messages: ChatCompletionAssistantMessageParam[]
    model: string
}

export interface ChatChunk extends RequestMessage {
    type: "chat.chunk"
    chatId: string
    finishReason?: string
    chunk?: string
    tokens?: number
}

export type RequestMessages =
    | ServerKill
    | ServerVersion
    | ServerEnv
    | ServerVersion
    | PromptScriptTestRun
    | ShellExec
    | PromptScriptStart
    | PromptScriptAbort
    | ChatChunk

export type ResponseEvents =
    | PromptScriptProgressResponseEvent
    | PromptScriptEndResponseEvent
