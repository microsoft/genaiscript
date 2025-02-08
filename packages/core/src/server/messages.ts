import type {
    ChatCompletionAssistantMessageParam,
    ChatCompletionMessageParam,
    ChatCompletionUsage,
} from "../chattypes"

export interface ResponseStatus {
    ok: boolean
    error?: SerializedError
    status?: number
}

export type OpenAIAPIType =
    | "openai"
    | "azure"
    | "localai"
    | "azure_serverless"
    | "azure_serverless_models"
    | "alibaba"
    | "huggingface"

export type AzureCredentialsType =
    | "default"
    | "cli"
    | "env"
    | "powershell"
    | "devcli"
    | "managedidentity"
    | "workloadidentity"

export interface LanguageModelConfiguration extends LanguageModelReference {
    base: string
    token: string
    source?: string
    type?: OpenAIAPIType
    aici?: boolean
    version?: string
    azureCredentialsType?: AzureCredentialsType
}

export interface LanguageModelInfo {
    id: string
    details?: string
    url?: string
}

export type ResolvedLanguageModelConfiguration =
    Partial<LanguageModelConfiguration> & {
        models?: LanguageModelInfo[]
        error?: string
    }

/**
 * Represents a project containing templates and diagnostics.
 * Provides utility methods to manage templates and diagnose issues.
 */
export interface Project {
    scripts: PromptScript[] // Array of templates within the project
    diagnostics: Diagnostic[] // Array of diagnostic records
}

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

export interface ServerEnvResponse extends ResponseStatus {
    providers: ResolvedLanguageModelConfiguration[]
    remote?: {
        url: string
        branch?: string
    }
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
    outOutput: string
    outAnnotations: string
    outChangelogs: string
    pullRequest: string
    pullRequestComment: string | boolean
    pullRequestDescription: string | boolean
    pullRequestReviews: boolean
    teamsMessage: boolean
    outData: string
    label: string
    temperature: string | number
    reasoningEffort: "high" | "low" | "medium"
    topP: string | number
    seed: string | number
    maxTokens: string | number
    maxToolCalls: string | number
    maxDataRepairs: string | number
    model: string
    smallModel: string
    visionModel: string
    embeddingsModel: string
    modelAlias: string[]
    provider: string
    csvSeparator: string
    cache: boolean | string
    cacheName: string
    applyEdits: boolean
    failOnErrors: boolean
    removeOut: boolean
    vars: string[] | Record<string, string | boolean | number | object>
    fallbackTools: boolean
    jsSource: string
    logprobs: boolean
    topLogprobs: number
    fenceFormat: FenceFormat
    workspaceFiles?: WorkspaceFile[]
    runTrace: boolean
}

export interface PromptScriptList extends RequestMessage {
    type: "script.list"
}

export interface PromptScriptListResponse extends ResponseStatus {
    project: Project
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

// Type representing possible statuses of generation
export type GenerationStatus = "success" | "error" | "cancelled" | undefined

// Interface for the result of a generation process
export interface GenerationResult extends GenerationOutput {
    /**
     * The environment variables passed to the prompt
     */
    env: Partial<ExpansionVariables>

    /**
     * Expanded prompt text composed of multiple messages
     */
    messages: ChatCompletionMessageParam[]

    /**
     * Edits to apply, if any
     */
    edits: Edits[]

    /**
     * Source annotations parsed as diagnostics
     */
    annotations: Diagnostic[]

    /**
     * Sections of the ChangeLog
     */
    changelogs: string[]

    /**
     * Error message or object, if any error occurred
     */
    error?: SerializedError

    /**
     * Status of the generation process (success, error, or cancelled)
     */
    status: GenerationStatus

    /**
     * Additional status information or message
     */
    statusText?: string

    /**
     * Completion status from the language model
     */
    finishReason?: string

    /**
     * Optional label for the run
     */
    label?: string

    /**
     * Version of the GenAIScript used
     */
    version: string

    /**
     * Log probs of the choices
     */
    choices?: Logprob[]

    /**
     * Logprobs if computed
     */
    logprobs?: Logprob[]

    /**
     * Statistics of the generation
     */
    perplexity?: number

    /**
     * Structural uncertainty
     */
    uncertainty?: number

    /**
     * Statistics of the generation
     */
    stats?: {
        cost: number
    } & ChatCompletionUsage
}

export interface PromptScriptEndResponseEvent {
    type: "script.end"
    runId: string
    exitCode: number
    result?: Partial<GenerationResult>
    trace?: string
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
    output?: string

    progress?: string

    tokens?: number

    response?: string
    responseChunk?: string
    responseTokens?: Logprob[]

    reasoning?: string
    reasoningChunk?: string
    reasoningTokens?: Logprob[]

    inner?: boolean
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

export interface ServerResponse extends ResponseStatus {
    version: string
    node: string
    platform: string
    arch: string
    pid: number
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

export type LogLevel = "debug" | "info" | "warn" | "error"

export interface LogMessageEvent {
    type: "log"
    message: string
    level: LogLevel
}

export type RequestMessages =
    | ServerKill
    | ServerEnv
    | ServerVersion
    | PromptScriptTestRun
    | PromptScriptStart
    | PromptScriptAbort
    | ChatChunk
    | LanguageModelConfigurationRequest
    | PromptScriptList

export type PromptScriptResponseEvents =
    | PromptScriptProgressResponseEvent
    | PromptScriptEndResponseEvent

export type ChatEvents = ChatStart | ChatCancel
