// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * GenAIScript supporting runtime
 * This module provides core functionality for text classification, data transformation,
 * PDF processing, and file system operations in the GenAIScript environment.
 */
import type {
  ChatGenerationContext,
  ChatGenerationContextOptions,
  ElementOrArray,
  ExpansionVariables,
  HostConfiguration,
  RuntimePromptContext,
} from "@genaiscript/core";
import {
  buildProject,
  createPromptContext,
  DEBUG_SCRIPT_CATEGORY,
  generateId,
  getRunDir,
  installGlobalPromptContext,
  installGlobals,
  genaiscriptDebug,
  LARGE_MODEL_ID,
} from "@genaiscript/core";
import { NodeHost } from "./nodehost.js";
import debug from "debug";
const dbg = genaiscriptDebug("runtime");

let _nodeHost: NodeHost | undefined;

export function resolveChatGenerationContext(
  options?: ChatGenerationContextOptions,
): ChatGenerationContext {
  const { ctx } = options || {};
  if (ctx) return ctx;
  const globalPromptContext: RuntimePromptContext = globalThis as unknown as RuntimePromptContext;
  const generator = globalPromptContext.env?.generator;
  if (!generator)
    throw new Error("You must pass a chat generation context when using the runtime.");
  return generator;
}

/**
 * Configure the default GenAIScript runtime environment. Installs the global helpers and configure host and env.
 */
export async function config(
  dotEnvPaths?: ElementOrArray<string>,
  hostConfig?: HostConfiguration,
): Promise<void> {
  if (_nodeHost) throw new Error("Runtime already configured. Call `config` only once.");

  dbg(`config %o`, dotEnvPaths);
  dbg(`hostConfig %O`, hostConfig);
  await NodeHost.install(dotEnvPaths, hostConfig);
  installGlobals();
  const prj = await buildProject();
  const runId = generateId();
  const runDir = getRunDir("runtime", runId);
  const env: ExpansionVariables = {
    runId,
    runDir,
    dir: process.cwd(),
    files: [],
    vars: {},
    secrets: {},
    meta: {
      id: "",
    },
    generator: undefined,
    output: undefined,
    dbg: debug(DEBUG_SCRIPT_CATEGORY),
  };
  const ctx = await createPromptContext(
    prj,
    env,
    undefined,
    {
      inner: false,
      stats: undefined,
      trace: undefined,
      model: LARGE_MODEL_ID,
      userState: {},
    },
    undefined,
  );
  installGlobalPromptContext(ctx);
}
