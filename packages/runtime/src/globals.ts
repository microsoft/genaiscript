// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import type {
  DefOptions,
  Fenced,
  PromptArgs,
  PromptTemplateString,
  RunPromptResult,
  ShellOutput,
  WorkspaceFile,
} from "@genaiscript/core";

/**
 * Global functions that can be imported for IDE support
 * These are stub implementations - the actual implementations are provided at runtime
 */

/**
 * Setup prompt title and other parameters.
 * Exactly one call should be present on top of .genai.mts file.
 * Note: This is a stub implementation for import support.
 * The actual implementation is provided at runtime during prompt execution.
 */
export function script(options: PromptArgs): void {
    // Runtime implementation will be provided during prompt execution
    throw new Error("script() can only be called within a GenAIScript prompt execution context")
}

/**
 * Append given string to the prompt. It automatically appends "\n".
 * `` $`foo` `` is the same as `text("foo")`.
 * Note: This is a stub implementation for import support.
 * The actual implementation is provided at runtime during prompt execution.
 */
export function $(
    strings: TemplateStringsArray,
    ...args: any[]
): PromptTemplateString {
    // Runtime implementation will be provided during prompt execution
    throw new Error("$() can only be called within a GenAIScript prompt execution context")
}

/**
 * Defines `name` to be the (often multi-line) string `body`.
 * Similar to `text(name + ":"); fence(body, language)`
 * Note: This is a stub implementation for import support.
 * The actual implementation is provided at runtime during prompt execution.
 */
export function def(
    name: string,
    body:
        | string
        | WorkspaceFile
        | WorkspaceFile[]
        | ShellOutput
        | Fenced
        | RunPromptResult,
    options?: DefOptions
): string {
    // Runtime implementation will be provided during prompt execution
    throw new Error("def() can only be called within a GenAIScript prompt execution context")
}