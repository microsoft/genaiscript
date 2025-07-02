// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import type { CancellationToken } from "./cancellation.js";
import type { ChatCompletionsOptions } from "./chattypes.js";
import { MarkdownTrace, TraceOptions } from "./trace.js";
import { GenerationStats } from "./usage.js";
import type {
  ContentSafetyOptions,
  EmbeddingsModelOptions,
  MetadataOptions,
  ModelOptions,
  PromptParameters,
  ScriptRuntimeOptions,
  WorkspaceFile,
} from "./types.js";

// Represents a code fragment with associated files
export interface Fragment {
  files: string[]; // Array of file paths or names
  workspaceFiles?: WorkspaceFile[]; // Array of workspace files
}

// Options for configuring the generation process, extending multiple other options
export interface GenerationOptions
  extends ChatCompletionsOptions,
    ModelOptions,
    EmbeddingsModelOptions,
    ContentSafetyOptions,
    ScriptRuntimeOptions,
    MetadataOptions,
    TraceOptions {
  inner: boolean; // Indicates if the process is an inner operation
  runId?: string;
  runDir?: string;
  cancellationToken?: CancellationToken; // Token to cancel the operation
  infoCb?: (partialResponse: { text: string }) => void; // Callback for providing partial responses
  outputTrace?: MarkdownTrace;
  maxCachedTemperature?: number; // Maximum temperature for caching purposes
  maxCachedTopP?: number; // Maximum top-p value for caching
  label?: string; // Optional label for the operation
  cliInfo?: {
    files: string[]; // Information about files in the CLI context
  };
  vars?: PromptParameters; // Variables for prompt customization
  stats: GenerationStats; // Statistics of the generation
  userState: Record<string, unknown>;
  applyGitIgnore?: boolean;
}
