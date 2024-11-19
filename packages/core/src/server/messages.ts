import { ChatCompletionAssistantMessageParam } from "../chattypes"
import { GenerationResult } from "../generation"
import { LanguageModelConfiguration, ResponseStatus } from "../host"

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

export interface PromptScriptTestRunOptions
    extends PromptScriptModelRunOptions {
    testProvider?: string
    models?: string[]
    groups?: string[]
}

export interface PromptScriptModelRunOptions {
    model?: string
    smallModel?: string
    visionModel?: string
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
    filesChunkSize: number
    excludedFiles: string[]
    excludeGitIgnore: boolean
    runRetry: string
    out: string
    retry: string
    retryDelay: string
    maxDelay: string
    json: boolean
    yaml: boolean
    outTrace: string
    outAnnotations: string
    outChangelogs: string
    pullRequest: string
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
    smallModel: string
    visionModel: string
    embeddingsModel: string
    csvSeparator: string
    cache: boolean | string
    cacheName: string
    applyEdits: boolean
    failOnErrors: boolean
    removeOut: boolean
    vars: string[]
    fallbackTools: boolean
    jsSource: string
    logprobs: boolean
    topLogprobs: number

    varsMap?: Record<string, string | boolean | number | object>
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
    responseTokens?: Logprob[]
    inner?: boolean
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

export interface LanguageModelConfigurationRequest extends RequestMessage {
    type: "model.configuration"
    model: string
    token?: boolean
    response?: LanguageModelConfigurationResponse
}

export interface LanguageModelConfigurationResponse extends ResponseStatus {
    info?: LanguageModelConfiguration
}

export interface ChatStart {
    type: "chat.start"
    chatId: string
    messages: ChatCompletionAssistantMessageParam[]
    model: string
    modelOptions?: {
        temperature?: number
    }
}

export interface ChatCancel {
    type: "chat.cancel"
    chatId: string
}

export interface ChatChunk extends RequestMessage {
    type: "chat.chunk"
    chatId: string
    model?: string
    finishReason?: string
    chunk?: string
    tokens?: number
    error?: SerializedError
}

export type RequestMessages =
    | ServerKill
    | ServerEnv
    | ServerVersion
    | PromptScriptTestRun
    | ShellExec
    | PromptScriptStart
    | PromptScriptAbort
    | ChatChunk
    | LanguageModelConfigurationRequest

export type PromptScriptResponseEvents =
    | PromptScriptProgressResponseEvent
    | PromptScriptEndResponseEvent

export type ChatEvents = ChatStart | ChatCancel
