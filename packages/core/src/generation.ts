// Import necessary modules and interfaces
import type { CancellationToken } from "./cancellation"
import type {
    ChatCompletionMessageParam,
    ChatCompletionsOptions,
    ChatCompletionUsage,
} from "./chattypes"
import { MarkdownTrace } from "./trace"
import { GenerationStats } from "./usage"

// Represents a code fragment with associated files
export interface Fragment {
    files: string[] // Array of file paths or names
    workspaceFiles?: WorkspaceFile[] // Array of workspace files
}

// Options for configuring the generation process, extending multiple other options
export interface GenerationOptions
    extends ChatCompletionsOptions,
        ModelOptions,
        EmbeddingsModelOptions,
        ContentSafetyOptions,
        ScriptRuntimeOptions {    
    inner: boolean // Indicates if the process is an inner operation
    cancellationToken?: CancellationToken // Token to cancel the operation
    infoCb?: (partialResponse: { text: string }) => void // Callback for providing partial responses
    trace: MarkdownTrace // Trace information for debugging or logging
    outputTrace?: MarkdownTrace
    maxCachedTemperature?: number // Maximum temperature for caching purposes
    maxCachedTopP?: number // Maximum top-p value for caching
    fallbackTools?: boolean // Disables model tools
    label?: string // Optional label for the operation
    cliInfo?: {
        files: string[] // Information about files in the CLI context
    }
    vars?: PromptParameters // Variables for prompt customization
    stats: GenerationStats // Statistics of the generation
}
