// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * GenAIScript supporting runtime
 * This module provides core functionality for text classification, data transformation,
 * PDF processing, and file system operations in the GenAIScript environment.
 */
import type { ElementOrArray, HostConfiguration, RuntimePromptContext } from "@genaiscript/core";
import { installGlobals } from "@genaiscript/core";
import { NodeHost } from "./nodehost.js";

export const globalPromptContext: RuntimePromptContext =
  globalThis as unknown as RuntimePromptContext;

let _nodeHost: NodeHost | undefined;

/**
 * Configure the default GenAIScript runtime environment. Installs the global helpers and configure host and env.
 */
export async function config(
  dotEnvPaths?: ElementOrArray<string>,
  hostConfig?: HostConfiguration,
): Promise<void> {
  if (_nodeHost) throw new Error("Runtime already configured. Call `config` only once.");
  installGlobals();
  await NodeHost.install(dotEnvPaths, hostConfig);
}
