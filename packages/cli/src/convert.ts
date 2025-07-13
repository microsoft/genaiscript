// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import type { PromptScriptRunOptions, WorkspaceFile } from "@genaiscript/core";
import {
  FILES_NOT_FOUND_ERROR_CODE,
  GENAI_ANY_REGEX,
  HTTPS_REGEX,
  JSON5_REGEX,
  OUTPUT_FILENAME,
  TRACE_FILENAME,
  YAML_REGEX,
  GenerationStats,
  MarkdownTrace,
  PLimitPromiseQueue,
  YAMLStringify,
  applyModelOptions,
  ensureDotGenaiscriptPath,
  filePathOrUrlToWorkspaceFile,
  getConvertDir,
  hash,
  host,
  link,
  logError,
  logInfo,
  logVerbose,
  measure,
  normalizeInt,
  toSignal,
  tracePromptResult,
  tryReadText,
  unfence,
  writeText,
} from "@genaiscript/core";
import { buildProject } from "@genaiscript/core";
import { run } from "@genaiscript/api";
import { setupTraceWriting } from "@genaiscript/core";
import { dirname, join } from "node:path";
import { createCancellationController } from "@genaiscript/core";

/**
 * Converts a set of files based on a specified script, applying transformations and generating output files.
 *
 * @param scriptId - Identifier of the script to use for file conversion.
 * @param fileGlobs - Array of file paths or glob patterns identifying files to be transformed.
 * @param options - Additional configuration for the conversion process:
 *   - `suffix` - Custom suffix for the output files.
 *   - `rewrite` - If true, overwrites existing files instead of creating new ones with a suffix.
 *   - `cancelWord` - A keyword that cancels processing if found in the result.
 *   - `concurrency` - Number of files to process concurrently.
 *   - `excludedFiles` - Array of file paths or glob patterns to exclude from processing.
 *   - `ignoreGitIgnore` - If true, ignores .gitignore rules during file resolution.
 *   - `runTrace` - If false, disables trace generation for individual files.
 *   - `outputTrace` - If false, disables output trace generation for individual files.
 *   - Other options passed to the transformation process.
 *
 * @throws Error if the script is not found or no files match the given patterns.
 *
 * Resolves files matching the provided patterns, filters them based on exclusion and rewrite options,
 * applies AI transformations using the specified script, and writes results to output files.
 */
export async function convertFiles(
  scriptId: string,
  fileGlobs: string[],
  options: Partial<PromptScriptRunOptions> & {
    suffix?: string;
    rewrite?: boolean;
    cancelWord?: string;
    concurrency?: string;
  },
): Promise<void> {
  const { excludedFiles, rewrite, cancelWord, concurrency, runTrace, outputTrace, ...restOptions } =
    options || {};

  await ensureDotGenaiscriptPath();
  const canceller = createCancellationController();
  const cancellationToken = canceller.token;
  const signal = toSignal(cancellationToken);
  applyModelOptions(options, "cli");
  const convertDir = getConvertDir(scriptId);
  const convertTrace = new MarkdownTrace({
    cancellationToken,
    dir: convertDir,
  });
  const outTraceFilename = await setupTraceWriting(
    convertTrace,
    "trace",
    join(convertDir, TRACE_FILENAME),
    { ignoreInner: true },
  );
  const outTraceDir = dirname(outTraceFilename);

  const fail = (msg: string, _exitCode: number, _url?: string) => {
    throw new Error(msg);
  };
  const { resolve } = host.path;

  const toolFiles: string[] = [];
  if (GENAI_ANY_REGEX.test(scriptId)) toolFiles.push(scriptId);
  const prj = await buildProject({
    toolFiles,
  });
  const script = prj.scripts.find(
    (t) =>
      t.id === scriptId ||
      (t.filename && GENAI_ANY_REGEX.test(scriptId) && resolve(t.filename) === resolve(scriptId)),
  );
  if (!script) {
    convertTrace.error(`script ${scriptId} not found`);
    throw new Error(`script ${scriptId} not found`);
  }
  const { responseType, responseSchema } = script;
  const ext =
    responseType === "yaml"
      ? ".yaml"
      : responseType === "text"
        ? ".txt"
        : /^json/.test(responseType) || responseSchema
          ? ".json"
          : ".md";
  const suffix = options?.suffix || `.genai.${script.id}${ext}`;
  convertTrace.heading(2, `convert with ${script.id}`);
  convertTrace.itemValue(`suffix`, suffix);

  // resolve files
  const applyGitIgnore = options.ignoreGitIgnore !== true && script.ignoreGitIgnore !== true;
  const resolvedFiles = new Set<string>();
  for (let arg of fileGlobs) {
    if (HTTPS_REGEX.test(arg)) {
      resolvedFiles.add(arg);
      continue;
    }
    const stats = await host.statFile(arg);
    if (stats?.type === "directory") arg = host.path.join(arg, "**", "*");
    const ffs = await host.findFiles(arg, {
      applyGitIgnore,
    });
    if (!ffs?.length) {
      return fail(
        `no files matching ${arg} under ${process.cwd()} (all files might have been ignored)`,
        FILES_NOT_FOUND_ERROR_CODE,
      );
    }
    for (const file of ffs) {
      if (!rewrite && file.toLocaleLowerCase().endsWith(suffix)) continue;
      resolvedFiles.add(filePathOrUrlToWorkspaceFile(file));
    }
  }
  if (excludedFiles?.length) {
    for (const arg of excludedFiles) {
      const ffs = await host.findFiles(arg);
      for (const f of ffs) resolvedFiles.delete(filePathOrUrlToWorkspaceFile(f));
    }
  }

  // processing
  const files = Array.from(resolvedFiles).map((filename) => ({ filename }) as WorkspaceFile);

  const stats: object[] = [];
  const usage = new GenerationStats("convert");
  const results: Record<string, string> = {};
  const p = new PLimitPromiseQueue(normalizeInt(concurrency) || 1);
  await p.mapAll(files, async (file) => {
    if (cancellationToken.isCancellationRequested) return;
    const outf = rewrite ? file.filename : file.filename + suffix;
    logInfo(`${file.filename} -> ${outf}`);
    const fni = await hash(file.filename, { length: 7 });
    const fileOutTrace = runTrace === false ? undefined : join(outTraceDir, fni, TRACE_FILENAME);
    const fileOutOutput =
      outputTrace === false ? undefined : join(outTraceDir, fni, OUTPUT_FILENAME);
    const fileTrace = convertTrace.startTraceDetails(file.filename);
    if (fileOutTrace) {
      convertTrace.item(link("trace", fileOutTrace));
      logVerbose(`trace: ${fileOutTrace}`);
    }
    if (fileOutOutput) {
      convertTrace.item(link("output", fileOutOutput));
      logVerbose(`output: ${fileOutOutput}`);
    }
    const m = measure("convert");
    try {
      // apply AI transformation
      const result = await run(script.filename, file.filename, {
        label: file.filename,
        outTrace: fileOutTrace,
        outOutput: fileOutOutput,
        runTrace: false,
        outputTrace: false,
        signal,
        ...restOptions,
      });
      tracePromptResult(fileTrace, result);
      const { error, json } = result || {};
      if (error) {
        logError(error);
        fileTrace.error(undefined, error);
        return;
      }
      if (result.status === "cancelled") {
        logVerbose(`cancelled ${file.filename}`);
        fileTrace.item(`cancelled`);
        return;
      }
      // LLM canceled
      if (cancelWord && result?.text?.includes(cancelWord)) {
        logVerbose(`cancel word detected, skipping ${file.filename}`);
        fileTrace.itemValue(`cancel word detected`, cancelWord);
        return;
      }
      const end = m();
      usage.addUsage(
        {
          total_tokens: result.usage?.total,
          prompt_tokens: result.usage?.prompt,
          completion_tokens: result.usage?.completion,
        },
        end,
      );
      if (result.usage) stats.push(result.usage);
      logVerbose(Object.keys(result.fileEdits || {}).join("\n"));
      // structured extraction
      const fileEdit = Object.entries(result.fileEdits || {}).find(
        ([fn]) => resolve(fn) === resolve(file.filename),
      )?.[1];
      //            if (!fileEdit) {
      //              console.log({
      //                filename: file.filename,
      //              edits: result.fileEdits,
      //        })
      const suffixext = suffix.replace(/^.genai./i, ".");
      const fence = result.fences.find((f) => f.language === suffixext);
      let text: string = undefined;
      if (fileEdit?.after) {
        if (fileEdit.validation?.schemaError) {
          logError("schema validation error");
          logVerbose(fileEdit.validation.schemaError);
          fileTrace.error(undefined, fileEdit.validation.schemaError);
          return;
        }
        text = fileEdit.after;
      }
      if (text === undefined && fence) {
        if (fence.validation?.schemaError) {
          logError("schema validation error");
          logVerbose(fence.validation.schemaError);
          fileTrace.error(undefined, fence.validation.schemaError);
          return;
        }
        text = fence.content;
      }
      if (text === undefined) text = unfence(result.text, "markdown");

      // normalize JSON
      if (JSON5_REGEX.test(outf)) text = JSON.stringify(json, null, 2);
      else if (YAML_REGEX.test(outf)) text = YAMLStringify(json);

      // save file
      const existing = await tryReadText(outf);
      if (text && existing !== text) {
        await writeText(outf, text);
      }

      results[file.filename] = text;
    } catch (error) {
      logError(error);
      fileTrace.error(undefined, error);
    } finally {
      logVerbose("");
      fileTrace.endDetails();
    }
  });

  usage.log();
  usage.trace(convertTrace);

  convertTrace.table(stats);
  logVerbose(`trace: ${outTraceFilename}`);
}
