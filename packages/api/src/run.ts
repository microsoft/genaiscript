// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { resolve, join, relative } from "node:path";
import { writeFile, appendFile } from "node:fs/promises";
import { confirmOrSkipInCI } from "@genaiscript/runtime";
import type {
  AzureDevOpsEnv,
  CancellationOptions,
  ChatCompletionsProgressReport,
  Fragment,
  GenerationResult,
  GithubConnectionInfo,
  PromptScriptRunOptions,
  TraceChunkEvent,
  TraceOptions,
} from "@genaiscript/core";
import {
  buildProject,
  convertDiagnosticsToSARIF,
  setupTraceWriting,
  ANNOTATION_ERROR_CODE,
  CLI_RUN_FILES_FOLDER,
  CONFIGURATION_ERROR_CODE,
  CONSOLE_COLOR_DEBUG,
  CONSOLE_COLOR_REASONING,
  CONSOLE_TOKEN_COLORS,
  CONSOLE_TOKEN_INNER_COLORS,
  CSV_REGEX,
  DOCS_CONFIGURATION_URL,
  FILES_NOT_FOUND_ERROR_CODE,
  GENAI_ANY_REGEX,
  LARGE_MODEL_ID,
  NEGATIVE_GLOB_REGEX,
  OUTPUT_FILENAME,
  REASONING_END_MARKER,
  REASONING_START_MARKER,
  RUNTIME_ERROR_CODE,
  TRACE_CHUNK,
  TRACE_FILENAME,
  USER_CANCELLED_ERROR_CODE,
  GenerationStats,
  JSONSchemaStringify,
  JSONSchemaStringifyToTypeScript,
  MarkdownTrace,
  YAMLStringify,
  appendJSONL,
  applyModelOptions,
  applyScriptModelAliases,
  assert,
  azureDevOpsCreateIssueComment,
  azureDevOpsParseEnv,
  azureDevOpsUpdatePullRequestDescription,
  checkCancelled,
  consoleColors,
  createStatsDir,
  diagnosticsToCSV,
  ellipse,
  errorMessage,
  filePathOrUrlToWorkspaceFile,
  genaiscriptDebug,
  generateId,
  getRunDir,
  githubCreateIssueComment,
  githubCreatePullRequestReviews,
  githubParseEnv,
  githubUpdatePullRequestDescription,
  host,
  isCI,
  isCancelError,
  isJSONLFilename,
  isQuiet,
  logError,
  logInfo,
  logModelAliases,
  logVerbose,
  logWarn,
  logprobColor,
  microsoftTeamsChannelPostMessage,
  normalizeFloat,
  normalizeInt,
  overrideStdoutWithStdErr,
  parsePromptScriptMeta,
  prettifyMarkdown,
  resolveModelConnectionInfo,
  runTemplate,
  runtimeHost,
  stderr,
  stdout,
  traceAgentMemory,
  tryResolveResource,
  tryResolveScript,
  uriTryParse,
  writeFileEdits,
  writeText,
  wrapColor,
  wrapRgbColor,
  capitalize,
  readStdIn,
  ensureDir,
  parseOptionsVars,
  rmDir,
  tryStat,
  createGitIgnorer,
  OPENAI_MAX_RETRY_AFTER_DEFAULT,
  OPENAI_MAX_RETRY_DELAY,
  OPENAI_MAX_RETRY_COUNT,
} from "@genaiscript/core";

const dbg = genaiscriptDebug("run");

/**
 * Executes a script internally with supplied options and handles outputs.
 *
 * @param scriptId - The identifier of the script to be executed.
 * @param files - Array of file paths or URLs to be processed by the script.
 * @param options - Configuration object including additional execution parameters:
 *   - runId: Optional identifier for the execution run.
 *   - runOutputTrace: Instance for capturing output trace events.
 *   - cli: Indicates if CLI mode is active.
 *   - infoCb: Callback function for informational messages.
 *   - partialCb: Callback for reporting partial progress in chat completions.
 *   - cancellationToken: Token for handling cancellation requests.
 *   - runTrace: Enables/disables trace file writing.
 *   - json/yaml: Toggles structured output formats.
 *   - vars: Variables to pass to the script.
 *   - reasoningEffort: Specifies reasoning intensity for model execution.
 *   - annotations/changelogs/data/output options: Configs for exporting diagnostics, changes, intermediate data, and results.
 *   - pullRequestComments, descriptions, or reviews: Enables integration with GitHub or Azure DevOps for updates.
 *   - applyEdits: Indicates if file edits should be applied.
 *   - retry/retryDelay/maxDelay: Configurations for retry logic.
 *   - cache: Cache name or configuration.
 *   - csvSeparator: Separator for CSV outputs.
 *   - removeOut: Indicates if the output directory should be cleared before execution.
 *   - jsSource: JavaScript source code for the script.
 *   - logprobs/topLogprobs: Configurations for log probability outputs.
 *   - fenceFormat: Specifies the format for fenced code blocks.
 *   - workspaceFiles: Additional files to include in the workspace.
 *   - excludedFiles: Files to exclude from processing.
 *   - ignoreGitIgnore: Disables applying .gitignore rules when resolving files.
 *   - label: Optional label for the execution run.
 *   - temperature: Sampling temperature for model execution.
 *   - fallbackTools: Fallback tools to use if primary tools fail.
 *   - topP: Top-p sampling parameter for model execution.
 *   - toolChoice: Specifies the tool to use for execution.
 *   - seed: Random seed for reproducibility.
 *   - maxTokens: Maximum number of tokens for model responses.
 *   - maxToolCalls: Maximum number of tool calls allowed.
 *   - maxDataRepairs: Maximum number of data repair attempts.
 *   - accept: Specifies file extensions to accept for processing.
 *   - failOnErrors: Indicates if the script should fail on errors.
 *   - outTrace: Path to write trace output.
 *   - outOutput: Path to write output trace.
 *   - outAnnotations: Path to write annotations.
 *   - outChangelogs: Path to write changelogs.
 *   - outData: Path to write intermediate data.
 *   - pullRequest: Pull request ID for integration.
 *   - pullRequestComment: Enables adding comments to pull requests.
 *   - pullRequestDescription: Enables updating pull request descriptions.
 *   - pullRequestReviews: Enables adding reviews to pull requests.
 *   - teamsMessage: Enables sending messages to Microsoft Teams.
 *
 * @returns A Promise resolving to an object containing:
 *   - exitCode: Final exit code of the script execution.
 *   - result: Generation result object from script processing.
 */
export async function runScriptInternal(
  scriptId: string,
  files: string[],
  options: Partial<PromptScriptRunOptions> &
    TraceOptions &
    CancellationOptions & {
      runId?: string;
      runOutputTrace?: MarkdownTrace;
      cli?: boolean;
      infoCb?: (partialResponse: { text: string }) => void;
      partialCb?: (progress: ChatCompletionsProgressReport) => void;
    },
): Promise<{ exitCode: number; result?: GenerationResult }> {
  dbg(`scriptid: %s`, scriptId);
  const runId = options.runId || generateId();
  dbg(`run id: `, runId);
  const runDir = options.out || getRunDir(scriptId, runId);
  dbg(`run dir: `, runDir);
  dbg(`files: %O`, files);
  const cancellationToken = options.cancellationToken;
  const {
    trace = new MarkdownTrace({ cancellationToken, dir: runDir }),
    runOutputTrace = new MarkdownTrace({ cancellationToken, dir: runDir }),
    infoCb,
    partialCb,
  } = options || {};

  runtimeHost.clearModelAlias("script");
  let result: GenerationResult;
  let workspaceFiles = options.workspaceFiles || [];
  const excludedFiles = options.excludedFiles || [];
  const stream = !options.json;
  const retries = normalizeInt(options.retry);
  const retryDelay = normalizeInt(options.retryDelay) || OPENAI_MAX_RETRY_COUNT;
  const maxDelay = normalizeInt(options.maxDelay) || OPENAI_MAX_RETRY_DELAY;
  const maxRetryAfter = normalizeInt(options.maxRetryAfter) || OPENAI_MAX_RETRY_AFTER_DEFAULT;
  const outTrace = options.outTrace;
  const outOutput = options.outOutput;
  const outAnnotations = options.outAnnotations;
  const failOnErrors = options.failOnErrors;
  const outChangelogs = options.outChangelogs;
  const pullRequestComment = options.pullRequestComment;
  const pullRequestDescription = options.pullRequestDescription;
  const pullRequestReviews = options.pullRequestReviews;
  const teamsMessage = options.teamsMessage;
  const outData = options.outData;
  const label = options.label;
  const temperature = normalizeFloat(options.temperature);
  const fallbackTools = options.fallbackTools;
  const reasoningEffort = options.reasoningEffort;
  const topP = normalizeFloat(options.topP);
  const toolChoice = options.toolChoice;
  const seed = normalizeFloat(options.seed);
  const maxTokens = normalizeInt(options.maxTokens);
  const maxToolCalls = normalizeInt(options.maxToolCalls);
  const maxDataRepairs = normalizeInt(options.maxDataRepairs);
  const cache = options.cacheName ?? options.cache;
  const applyEdits = !!options.applyEdits;
  const csvSeparator = options.csvSeparator || "\t";
  const removeOut = options.removeOut;
  const jsSource = options.jsSource;
  const logprobs = options.logprobs;
  const topLogprobs = normalizeInt(options.topLogprobs);
  const fenceFormat = options.fenceFormat;

  assert(!!runDir);

  if (options.json) overrideStdoutWithStdErr();
  applyModelOptions(options, "cli");

  const fail = (msg: string, exitCode: number, url?: string) => {
    logError(url ? `${msg} (see ${url})` : msg);
    trace?.error(msg);
    return { exitCode, result };
  };

  logInfo(`genaiscript: ${scriptId}`);
  dbg(`run id: %s`, runId);
  dbg(`ci: %s`, isCI);

  // manage out folder
  if (removeOut) await rmDir(runDir);
  await ensureDir(runDir);

  const outTraceFilename =
    options.runTrace === false || (isCI && !options.runTrace)
      ? undefined
      : await setupTraceWriting(trace, "trace", join(runDir, TRACE_FILENAME));
  const outputFilename =
    options.outputTrace === false || (isCI && !options.outputTrace)
      ? undefined
      : await setupTraceWriting(runOutputTrace, "output", join(runDir, OUTPUT_FILENAME), {
          ignoreInner: true,
        });
  if (outTrace && !/^false$/i.test(outTrace)) await setupTraceWriting(trace, " trace", outTrace);
  if (outOutput && !/^false$/i.test(outOutput)) {
    await setupTraceWriting(runOutputTrace, " output", outOutput, {
      ignoreInner: true,
    });
  }

  const toolFiles: string[] = [];
  const resourceScript = await tryResolveScript(scriptId, {
    trace,
    cancellationToken,
  });
  if (resourceScript) {
    scriptId = resourceScript;
    dbg(`resolved script file: %s`, scriptId);
    toolFiles.push(scriptId);
  } else if (GENAI_ANY_REGEX.test(scriptId)) toolFiles.push(scriptId);

  const prj = await buildProject({
    toolFiles,
  });
  if (jsSource) {
    prj.scripts.push({
      id: scriptId,
      ...parsePromptScriptMeta(jsSource),
      jsSource,
    });
  }
  const script = prj.scripts.find(
    (t) =>
      t.id === scriptId ||
      (t.filename && GENAI_ANY_REGEX.test(scriptId) && resolve(t.filename) === resolve(scriptId)),
  );
  if (!script) {
    dbg(`script id not found: %s`, scriptId);
    dbg(
      `scripts: %O`,
      prj.scripts.map((s) => ({ id: s.id, filename: s.filename })),
    );
    throw new Error(`script ${scriptId} not found`);
  }
  const applyGitIgnore = options.ignoreGitIgnore !== true && script.ignoreGitIgnore !== true;
  dbg(`apply gitignore: ${applyGitIgnore}`);
  const ignorer = applyGitIgnore ? await createGitIgnorer() : undefined;
  const resolvedFiles = new Set<string>();
  // move exclusions to excludedFiles
  excludedFiles.push(
    ...files
      .filter((f) => NEGATIVE_GLOB_REGEX.test(f))
      .map((f) => f.replace(NEGATIVE_GLOB_REGEX, "")),
  );
  files = files.filter((f) => !NEGATIVE_GLOB_REGEX.test(f));
  dbg(`files (remaining): %O`, files);
  for (let arg of files) {
    checkCancelled(cancellationToken);
    dbg(`resolving ${arg}`);
    const stat = await host.statFile(arg);
    if (stat?.type === "file") {
      dbg(`file found %s`, arg);
      if (!ignorer?.([arg])?.length) {
        dbg(`ignored by gitignore`);
        continue;
      }
      resolvedFiles.add(filePathOrUrlToWorkspaceFile(arg));
      continue;
    }

    const uriArg = uriTryParse(arg);
    if (uriArg) {
      dbg(`parsed uri %o`, uriArg);
      const resource = await tryResolveResource(arg, {
        trace,
        cancellationToken,
      });
      if (!resource) return fail(`resource ${arg} not found`, FILES_NOT_FOUND_ERROR_CODE);
      dbg(`resolved %d files`, resource.files.length);
      workspaceFiles.push(...resource.files);
      continue;
    }

    if (stat?.type === "directory") {
      arg = host.path.join(arg, "**", "*");
      dbg(`directory, updating to %s`, arg);
    }
    dbg(`expand ${arg} (apply .gitignore: ${applyGitIgnore})`);
    const ffs = await host.findFiles(arg, {
      applyGitIgnore,
    });
    if (!ffs?.length && arg.includes("*")) {
      // edge case when gitignore dumps 1 file
      return fail(
        `no files matching ${arg} under ${process.cwd()} (all files might have been ignored)`,
        FILES_NOT_FOUND_ERROR_CODE,
      );
    }
    for (const file of ffs) {
      resolvedFiles.add(filePathOrUrlToWorkspaceFile(file));
    }
  }

  if (excludedFiles.length) {
    for (const arg of excludedFiles) {
      const ffs = await host.findFiles(arg);
      for (const f of ffs) {
        dbg(`removing excluded file %s`, f);
        resolvedFiles.delete(filePathOrUrlToWorkspaceFile(f));
      }
    }
  }

  // try reading stdin
  const stdin = await readStdIn();
  if (stdin) {
    dbg(`stdin: %s`, ellipse(stdin.content, 42));
    workspaceFiles.push(stdin);
  }

  const accept = script.accept || options.accept;
  if (accept) {
    dbg(`accept: %s`, accept);
    const exts = accept
      .split(",")
      .map((s) => s.trim().replace(/^\*\./, "."))
      .filter((s) => !!s);
    dbg(`extensions: %o`, exts);
    for (const rf of resolvedFiles) {
      if (!exts.some((ext) => rf.endsWith(ext))) resolvedFiles.delete(rf);
    }
    workspaceFiles = workspaceFiles.filter(({ filename }) =>
      exts.some((ext) => filename.endsWith(ext)),
    );
    dbg(`filtered files: %d %d`, resolvedFiles.size, workspaceFiles.length);
  }

  const reasoningEndMarker = wrapColor(CONSOLE_COLOR_REASONING, REASONING_END_MARKER);
  const reasoningStartMarker = wrapColor(CONSOLE_COLOR_REASONING, REASONING_START_MARKER);
  let tokenColor = 0;
  let reasoningOutput = false;
  runOutputTrace.addEventListener(TRACE_CHUNK, (ev) => {
    const { progress, chunk } = ev as TraceChunkEvent;
    if (progress) {
      const { responseChunk, responseTokens, inner, reasoningChunk } = progress;
      if (
        !isQuiet &&
        reasoningChunk !== undefined &&
        reasoningChunk !== null &&
        reasoningChunk !== ""
      ) {
        if (!reasoningOutput) stderr.write(reasoningStartMarker);
        reasoningOutput = true;
        stderr.write(wrapColor(CONSOLE_COLOR_REASONING, reasoningChunk));
      }
      if (responseChunk !== undefined && responseChunk !== null && responseChunk !== "") {
        if (reasoningOutput) {
          stderr.write(reasoningEndMarker);
          reasoningOutput = false;
        }
        if (stream) {
          if (responseTokens && consoleColors) {
            const colors = inner ? CONSOLE_TOKEN_INNER_COLORS : CONSOLE_TOKEN_COLORS;
            for (const token of responseTokens) {
              if (!isNaN(token.logprob)) {
                const c = wrapRgbColor(logprobColor(token), token.token);
                stdout.write(c);
              } else {
                tokenColor = (tokenColor + 1) % colors.length;
                const c = colors[tokenColor];
                stdout.write(wrapColor(c, token.token));
              }
            }
          } else {
            if (!inner) stdout.write(responseChunk);
            else {
              stderr.write(wrapColor(CONSOLE_COLOR_DEBUG, responseChunk));
            }
          }
        } else if (!isQuiet) {
          stderr.write(wrapColor(CONSOLE_COLOR_DEBUG, responseChunk));
        }
      }
    } else if (!isQuiet && chunk !== undefined && chunk !== null && chunk !== "") {
      if (reasoningOutput) {
        stderr.write(reasoningEndMarker);
        reasoningOutput = false;
      }
      stdout.write(chunk);
    }
  });

  const fragment: Fragment = {
    files: Array.from(resolvedFiles),
    workspaceFiles,
  };
  dbg(
    `files: %O\n workspace files: %O`,
    fragment.files,
    fragment.workspaceFiles.map((f) => f.filename),
  );
  const vars = parseOptionsVars(options.vars, process.env);
  dbg(`vars: %o`, Object.keys(vars));
  const stats = new GenerationStats("");
  const userState: Record<string, unknown> = {};
  try {
    if (options.label) trace.heading(2, options.label);
    applyScriptModelAliases(script);
    logModelAliases();
    const { info } = await resolveModelConnectionInfo(script, {
      trace,
      model: options.model,
      defaultModel: LARGE_MODEL_ID,
      token: true,
    });
    if (info.error) {
      trace.error(undefined, info.error);
      return fail(
        info.error ?? "invalid model configuration",
        CONFIGURATION_ERROR_CODE,
        DOCS_CONFIGURATION_URL,
      );
    }

    result = await runTemplate(prj, script, fragment, {
      runId,
      inner: false,
      infoCb: (args) => {
        const { text } = args;
        if (text) {
          if (!isQuiet) logInfo(text);
          infoCb?.(args);
        }
      },
      partialCb: (args) => {
        runOutputTrace.chatProgress(args);
        partialCb?.(args);
      },
      label,
      cache,
      temperature,
      reasoningEffort,
      topP,
      toolChoice,
      seed,
      cancellationToken,
      maxTokens,
      maxToolCalls,
      maxDataRepairs,
      model: info.model,
      embeddingsModel: options.embeddingsModel,
      retries,
      retryDelay,
      maxDelay,
      maxRetryAfter,
      vars,
      trace,
      outputTrace: runOutputTrace,
      fallbackTools,
      logprobs,
      topLogprobs,
      fenceFormat,
      runDir,
      applyGitIgnore,
      cliInfo: options.cli
        ? {
            files,
          }
        : undefined,
      stats,
      userState,
    });
  } catch (err) {
    stats.log();
    if (isCancelError(err)) return fail("user cancelled", USER_CANCELLED_ERROR_CODE);
    logError(err);
    return fail("runtime error", RUNTIME_ERROR_CODE);
  }

  dbg(`result: %s`, result.finishReason);
  dbg(`annotations: %d`, result.annotations?.length);

  await aggregateResults(scriptId, outTrace, stats, result);
  await traceAgentMemory({ userState, trace });

  if (outAnnotations && result.annotations?.length) {
    if (isJSONLFilename(outAnnotations)) await appendJSONL(outAnnotations, result.annotations);
    else {
      await writeText(
        outAnnotations,
        CSV_REGEX.test(outAnnotations)
          ? diagnosticsToCSV(result.annotations, csvSeparator)
          : /\.ya?ml$/i.test(outAnnotations)
            ? YAMLStringify(result.annotations)
            : /\.sarif$/i.test(outAnnotations)
              ? await convertDiagnosticsToSARIF(script, result.annotations)
              : JSON.stringify(result.annotations, null, 2),
      );
    }
  }
  if (outChangelogs && result.changelogs?.length) {
    await writeText(outChangelogs, result.changelogs.join("\n"));
  }
  if (outData && result.frames?.length) {
    if (isJSONLFilename(outData)) await appendJSONL(outData, result.frames);
    else await writeText(outData, JSON.stringify(result.frames, null, 2));
  }

  await writeFileEdits(result.fileEdits, { applyEdits, trace });

  const promptjson = result.messages?.length ? JSON.stringify(result.messages, null, 2) : undefined;
  const jsonf = join(runDir, `res.json`);
  const yamlf = join(runDir, `res.yaml`);

  const mkfn = (ext: string) => jsonf.replace(/\.json$/i, ext);
  const promptf = mkfn(".prompt.json");
  const outputjson = mkfn(".output.json");
  const outputyaml = mkfn(".output.yaml");
  const annotationf = result.annotations?.length ? mkfn(".annotations.csv") : undefined;
  const sariff = result.annotations?.length ? mkfn(".sarif") : undefined;
  const changelogf = result.changelogs?.length ? mkfn(".changelog.txt") : undefined;
  await writeText(jsonf, JSON.stringify(result, null, 2));
  await writeText(yamlf, YAMLStringify(result));
  if (promptjson) await writeText(promptf, promptjson);
  if (result.json) {
    await writeText(outputjson, JSON.stringify(result.json, null, 2));
    await writeText(outputyaml, YAMLStringify(result.json));
  }
  if (result.schemas) {
    for (const [sname, schema] of Object.entries(result.schemas)) {
      await writeText(
        join(runDir, `${sname.toLocaleLowerCase()}.schema.ts`),
        JSONSchemaStringifyToTypeScript(schema, {
          typeName: capitalize(sname),
          export: true,
        }),
      );
      await writeText(
        join(runDir, `${sname.toLocaleLowerCase()}.schema.json`),
        JSONSchemaStringify(schema),
      );
    }
  }
  if (annotationf) {
    await writeText(
      annotationf,
      `severity, filename, start, end, message\n` +
        result.annotations
          .map(
            ({ severity, filename, range, message }) =>
              `${severity}, ${filename}, ${range[0][0]}, ${range[1][0]}, ${message} `,
          )
          .join("\n"),
    );
  }
  if (sariff) await writeText(sariff, await convertDiagnosticsToSARIF(script, result.annotations));
  if (changelogf && result.changelogs?.length) {
    await writeText(changelogf, result.changelogs.join("\n"));
  }
  for (const [filename, edits] of Object.entries(result.fileEdits || {})) {
    const rel = relative(process.cwd(), filename);
    const isAbsolutePath = resolve(rel) === rel;
    if (!isAbsolutePath) await writeText(join(runDir, CLI_RUN_FILES_FOLDER, rel), edits.after);
  }

  if (options.json && result !== undefined) {
    // needs to go to process.stdout
    stdout.write(JSON.stringify(result, null, 2));
  }

  let _ghInfo: GithubConnectionInfo = undefined;
  const resolveGitHubInfo = async () => {
    if (!_ghInfo) {
      _ghInfo = await githubParseEnv(process.env, {
        resolveToken: true,
        resolveIssue: true,
        resolveCommit: true,
      });
    }
    return _ghInfo;
  };
  let adoInfo: AzureDevOpsEnv = undefined;

  if (teamsMessage && result.text) {
    const ghInfo = await resolveGitHubInfo();
    const channelURL = process.env.GENAISCRIPT_TEAMS_CHANNEL_URL || process.env.TEAMS_CHANNEL_URL;
    if (
      channelURL &&
      (await confirmOrSkipInCI("Would you like to post to Teams?", {
        preview: result.text,
      }))
    ) {
      await microsoftTeamsChannelPostMessage(channelURL, prettifyMarkdown(result.text), {
        script,
        info: ghInfo,
        cancellationToken,
        trace,
      });
    }
  }

  if (pullRequestComment && result.text) {
    dbg(`upsert pull request comment`);
    const ghInfo = await resolveGitHubInfo();
    if (
      ghInfo.repository &&
      ghInfo.issue &&
      (await confirmOrSkipInCI("Would you like to add a pull request comment?", {
        preview: result.text,
      }))
    ) {
      await githubCreateIssueComment(
        script,
        ghInfo,
        result.text,
        typeof pullRequestComment === "string" ? pullRequestComment : script.id,
        { cancellationToken },
      );
    } else {
      adoInfo = adoInfo ?? (await azureDevOpsParseEnv(process.env));
      if (
        adoInfo.collectionUri &&
        (await confirmOrSkipInCI("Would you like to add a pull request comment?", {
          preview: result.text,
        }))
      ) {
        await azureDevOpsCreateIssueComment(
          script,
          adoInfo,
          prettifyMarkdown(result.text),
          typeof pullRequestComment === "string" ? pullRequestComment : script.id,
        );
      } else logError("pull request comment: no pull request information found");
    }
  }

  if (pullRequestDescription && result.text) {
    // github action or repo
    const ghInfo = await resolveGitHubInfo();
    if (
      ghInfo.repository &&
      ghInfo.issue &&
      (await confirmOrSkipInCI("Would you like to update the pull request description?", {
        preview: result.text,
      }))
    ) {
      await githubUpdatePullRequestDescription(
        script,
        ghInfo,
        prettifyMarkdown(result.text),
        typeof pullRequestDescription === "string" ? pullRequestDescription : script.id,
        { cancellationToken },
      );
    } else {
      // azure devops pipeline
      adoInfo = adoInfo ?? (await azureDevOpsParseEnv(process.env));
      if (
        adoInfo.collectionUri &&
        (await confirmOrSkipInCI("Would you like to update the pull request description?", {
          preview: result.text,
        }))
      ) {
        await azureDevOpsUpdatePullRequestDescription(
          script,
          adoInfo,
          prettifyMarkdown(result.text),
          typeof pullRequestDescription === "string" ? pullRequestDescription : script.id,
        );
      } else {
        logError("pull request description: no pull request information found");
      }
    }
  }

  if (pullRequestReviews && result.annotations?.length) {
    dbg(`adding pull request reviews`);
    const ghInfo = await resolveGitHubInfo();
    if (ghInfo.repository && ghInfo.issue) {
      if (!ghInfo.commitSha) dbg(`no commit sha found, skipping pull request reviews`);
      else {
        await githubCreatePullRequestReviews(script, ghInfo, result.annotations, {
          cancellationToken,
        });
      }
    }
  }

  if (result.status === "success") logInfo(`genaiscript: ${result.status}`);
  else if (result.status === "cancelled") logWarn(`genaiscript: ${result.status}`);
  else logError(`genaiscript: ${result.status}`);
  stats.log();
  if (outTraceFilename) logVerbose(`   trace: ${outTraceFilename}`);
  if (outputFilename) logVerbose(`  output: ${outputFilename}`);

  if (result.status !== "success" && result.status !== "cancelled") {
    const msg = errorMessage(result.error) ?? result.statusText ?? result.finishReason;
    return fail(msg, RUNTIME_ERROR_CODE);
  }

  if (failOnErrors && result.annotations?.some((a) => a.severity === "error")) {
    return fail("error annotations found", ANNOTATION_ERROR_CODE);
  }

  return { exitCode: 0, result };
}

async function aggregateResults(
  scriptId: string,
  outTrace: string,
  stats: GenerationStats,
  result: GenerationResult,
) {
  const statsDir = await createStatsDir();
  const statsFile = host.path.join(statsDir, "runs.csv");
  if (!(await tryStat(statsFile))) {
    await writeFile(
      statsFile,
      [
        "script",
        "status",
        "cost",
        "total_tokens",
        "prompt_tokens",
        "completion_tokens",
        "trace",
        "version",
      ].join(",") + "\n",
      { encoding: "utf-8" },
    );
  }
  const acc = stats.accumulatedUsage();
  await appendFile(
    statsFile,
    [
      scriptId,
      result.status,
      stats.cost(),
      acc.total_tokens,
      acc.prompt_tokens,
      acc.completion_tokens,
      outTrace ? host.path.basename(outTrace) : "",
      result.version,
    ]
      .map((s) => String(s))
      .join(",") + "\n",
    { encoding: "utf-8" },
  );
}
