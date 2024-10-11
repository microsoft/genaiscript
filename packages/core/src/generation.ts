// Import necessary modules and interfaces
import { CancellationToken } from "./cancellation"
import { LanguageModel } from "./chat"
import { ChatCompletionMessageParam, ChatCompletionsOptions } from "./chattypes"
import { MarkdownTrace } from "./trace"
import { GenerationStats } from "./usage"

// Represents a code fragment with associated files
export interface Fragment {
    files: string[] // Array of file paths or names
}

// Interface for the result of a generation process
export interface GenerationResult extends GenerationOutput {
    /**
     * The environment variables passed to the prompt
     */
    vars: Partial<ExpansionVariables>

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
    error?: unknown

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
}

// Type representing possible statuses of generation
export type GenerationStatus = "success" | "error" | "cancelled" | undefined

// Options for configuring the generation process, extending multiple other options
export interface GenerationOptions
    extends ChatCompletionsOptions,
        ModelOptions,
        EmbeddingsModelOptions,
        ScriptRuntimeOptions {
    inner: boolean // Indicates if the process is an inner operation
    cancellationToken?: CancellationToken // Token to cancel the operation
    infoCb?: (partialResponse: { text: string }) => void // Callback for providing partial responses
    trace: MarkdownTrace // Trace information for debugging or logging
    maxCachedTemperature?: number // Maximum temperature for caching purposes
    maxCachedTopP?: number // Maximum top-p value for caching
    label?: string // Optional label for the operation
    cliInfo?: {
        files: string[] // Information about files in the CLI context
    }
    vars?: PromptParameters // Variables for prompt customization
    stats: GenerationStats // Statistics of the generation
}
