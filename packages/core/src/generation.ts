import { CancellationToken } from "./cancellation"
import { LanguageModel } from "./chat"
import { ChatCompletionMessageParam, ChatCompletionsOptions } from "./chattypes"
import { MarkdownTrace } from "./trace"

export interface Fragment {
    files: string[]
}

export interface GenerationResult extends GenerationOutput {
    /**
     * The env variables sent to the prompt
     */
    vars: Partial<ExpansionVariables>

    /**
     * Expanded prompt text
     */
    messages: ChatCompletionMessageParam[]

    /**
     * Zero or more edits to apply.
     */
    edits: Edits[]

    /**
     * Parsed source annotations
     */
    annotations: Diagnostic[]

    /**
     * ChangeLog sections
     */
    changelogs: string[]

    /**
     * Error message if any
     */
    error?: unknown

    /**
     * Run status
     */
    status: GenerationStatus

    /**
     * Status message if any
     */
    statusText?: string

    /**
     * LLM completion status
     */
    finishReason?: string

    /**
     * Run label if provided
     */
    label?: string

    /**
     * GenAIScript version
     */
    version: string
}

export interface GenerationStats {
    toolCalls: number
    repairs: number
    turns: number
}

export type GenerationStatus = "success" | "error" | "cancelled" | undefined

export interface GenerationOptions
    extends ChatCompletionsOptions,
        ModelOptions,
        EmbeddingsModelOptions,
        ScriptRuntimeOptions {
    inner: boolean
    cancellationToken?: CancellationToken
    infoCb?: (partialResponse: { text: string }) => void
    trace: MarkdownTrace
    maxCachedTemperature?: number
    maxCachedTopP?: number
    skipLLM?: boolean
    label?: string
    cliInfo?: {
        files: string[]
    }
    vars?: PromptParameters
    stats: GenerationStats
}
