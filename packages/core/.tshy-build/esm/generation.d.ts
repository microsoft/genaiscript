import type { CancellationToken } from "./cancellation.js";
import type { ChatCompletionsOptions } from "./chattypes.js";
import { MarkdownTrace, TraceOptions } from "./trace.js";
import { GenerationStats } from "./usage.js";
import type { ContentSafetyOptions, EmbeddingsModelOptions, MetadataOptions, ModelOptions, PromptParameters, ScriptRuntimeOptions, WorkspaceFile } from "./types.js";
export interface Fragment {
    files: string[];
    workspaceFiles?: WorkspaceFile[];
}
export interface GenerationOptions extends ChatCompletionsOptions, ModelOptions, EmbeddingsModelOptions, ContentSafetyOptions, ScriptRuntimeOptions, MetadataOptions, TraceOptions {
    inner: boolean;
    runId?: string;
    runDir?: string;
    cancellationToken?: CancellationToken;
    infoCb?: (partialResponse: {
        text: string;
    }) => void;
    outputTrace?: MarkdownTrace;
    maxCachedTemperature?: number;
    maxCachedTopP?: number;
    label?: string;
    vars?: PromptParameters;
    stats: GenerationStats;
    userState: Record<string, unknown>;
    applyGitIgnore?: boolean;
    renderChatMessages?: boolean;
}
//# sourceMappingURL=generation.d.ts.map