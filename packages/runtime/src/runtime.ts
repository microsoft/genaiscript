// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * GenAIScript supporting runtime
 * This module provides core functionality for text classification, data transformation,
 * PDF processing, and file system operations in the GenAIScript environment.
 */
import type { PromptContext } from "@genaiscript/core";

const globalPromptContext: PromptContext = globalThis as unknown as PromptContext;
