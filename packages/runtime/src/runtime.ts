// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

/**
 * GenAIScript supporting runtime
 * This module provides core functionality for text classification, data transformation,
 * PDF processing, and file system operations in the GenAIScript environment.
 */
import "./globals.js";
import type {
  ChatGenerationContext,
  ChatGenerationContextOptions,
  ElementOrArray,
  ExpansionVariables,
  HostConfiguration,
  ImageGenerationOptions,
  Path,
  PromptGenerator,
  PromptGeneratorOptions,
  PromptHost,
  Retrieval,
  RunPromptResult,
  RunPromptResultPromiseWithOptions,
  RuntimePromptContext,
  SpeechOptions,
  SpeechResult,
  TranscriptionOptions,
  TranscriptionResult,
  WorkspaceFile,
  WorkspaceFileSystem,
} from "@genaiscript/core";
import {
  buildProject,
  createPromptContext,
  DEBUG_SCRIPT_CATEGORY,
  generateId,
  getRunDir,
  installGlobalPromptContext,
  genaiscriptDebug,
  LARGE_MODEL_ID,
  MarkdownTrace,
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

declare global {
  const host: PromptHost;
  const retrieval: Retrieval;
  const workspace: WorkspaceFileSystem;
  const env: ExpansionVariables;
  const path: Path;
  /**
   * Expands and executes prompt
   * @param generator
   */
  function runPrompt(
    generator: string | PromptGenerator,
    options?: PromptGeneratorOptions,
  ): Promise<RunPromptResult>;

  /**
   * Expands and executes the prompt
   */
  function prompt(
    strings: TemplateStringsArray,
    ...args: unknown[]
  ): RunPromptResultPromiseWithOptions;

  /**
   * Transcribes audio to text.
   * @param audio An audio file to transcribe.
   * @param options
   */
  function transcribe(
    audio: string | WorkspaceFile,
    options?: TranscriptionOptions,
  ): Promise<TranscriptionResult>;

  /**
   * Converts text to speech.
   * @param text
   * @param options
   */
  function speak(text: string, options?: SpeechOptions): Promise<SpeechResult>;

  /**
   * Generate an image and return the workspace file.
   * @param prompt
   * @param options
   */
  function generateImage(
    prompt: string,
    options?: ImageGenerationOptions,
  ): Promise<{ image: WorkspaceFile; revisedPrompt?: string }>;
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
  const prj = await buildProject();
  const runId = generateId();
  const runDir = getRunDir("runtime", runId);
  const output = new MarkdownTrace();
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
    output,
    dbg: debug(DEBUG_SCRIPT_CATEGORY),
  };
  const ctx = await createPromptContext(
    prj,
    env,
    {
      inner: false,
      stats: undefined,
      model: LARGE_MODEL_ID,
      userState: {},
    },
    LARGE_MODEL_ID,
  );
  installGlobalPromptContext(ctx);
}

export function context(): RuntimePromptContext {
  const globalPromptContext: RuntimePromptContext = globalThis as unknown as RuntimePromptContext;
  if (!globalPromptContext.env) throw new Error("Runtime not configured. Call `config` first.");
  return globalPromptContext;
}
