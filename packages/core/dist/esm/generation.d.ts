import type { CancellationToken } from "./cancellation.js";
import type { ChatCompletionsOptions } from "./chattypes.js";
import { MarkdownTrace } from "./trace.js";
import { GenerationStats } from "./usage.js";
export interface Fragment {
  files: string[];
  workspaceFiles?: WorkspaceFile[];
}
export interface GenerationOptions
  extends ChatCompletionsOptions,
    ModelOptions,
    EmbeddingsModelOptions,
    ContentSafetyOptions,
    ScriptRuntimeOptions,
    MetadataOptions {
  inner: boolean;
  runId?: string;
  runDir?: string;
  cancellationToken?: CancellationToken;
  infoCb?: (partialResponse: { text: string }) => void;
  trace: MarkdownTrace;
  outputTrace?: MarkdownTrace;
  maxCachedTemperature?: number;
  maxCachedTopP?: number;
  label?: string;
  cliInfo?: {
    files: string[];
  };
  vars?: PromptParameters;
  stats: GenerationStats;
  userState: Record<string, any>;
}
//# sourceMappingURL=generation.d.ts.map
