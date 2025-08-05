"use strict";
// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
Object.defineProperty(exports, "__esModule", { value: true });
exports.runScriptInternal = runScriptInternal;
const node_path_1 = require("node:path");
const promises_1 = require("node:fs/promises");
const runtime_1 = require("@genaiscript/runtime");
const core_1 = require("@genaiscript/core");
const dbg = (0, core_1.genaiscriptDebug)("run");
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
async function runScriptInternal(scriptId, files, options) {
    dbg(`scriptid: %s`, scriptId);
    const runId = options.runId || (0, core_1.generateId)();
    dbg(`run id: `, runId);
    const runDir = options.out || (0, core_1.getRunDir)(scriptId, runId);
    dbg(`run dir: `, runDir);
    dbg(`files: %O`, files);
    const cancellationToken = options.cancellationToken;
    const { trace = new core_1.MarkdownTrace({ cancellationToken, dir: runDir }), runOutputTrace = new core_1.MarkdownTrace({ cancellationToken, dir: runDir }), infoCb, partialCb, } = options || {};
    const runtimeHost = (0, core_1.resolveRuntimeHost)();
    runtimeHost.clearModelAlias("script");
    let result;
    let workspaceFiles = options.workspaceFiles || [];
    const excludedFiles = options.excludedFiles || [];
    const stream = !options.json;
    const retries = (0, core_1.normalizeInt)(options.retry);
    const retryDelay = (0, core_1.normalizeInt)(options.retryDelay) || core_1.OPENAI_MAX_RETRY_COUNT;
    const maxDelay = (0, core_1.normalizeInt)(options.maxDelay) || core_1.OPENAI_MAX_RETRY_DELAY;
    const maxRetryAfter = (0, core_1.normalizeInt)(options.maxRetryAfter) || core_1.OPENAI_MAX_RETRY_AFTER_DEFAULT;
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
    const temperature = (0, core_1.normalizeFloat)(options.temperature);
    const fallbackTools = options.fallbackTools;
    const reasoningEffort = options.reasoningEffort;
    const topP = (0, core_1.normalizeFloat)(options.topP);
    const toolChoice = options.toolChoice;
    const seed = (0, core_1.normalizeFloat)(options.seed);
    const maxTokens = (0, core_1.normalizeInt)(options.maxTokens);
    const maxToolCalls = (0, core_1.normalizeInt)(options.maxToolCalls);
    const maxDataRepairs = (0, core_1.normalizeInt)(options.maxDataRepairs);
    const cache = options.cacheName ?? options.cache;
    const applyEdits = !!options.applyEdits;
    const csvSeparator = options.csvSeparator || "\t";
    const removeOut = options.removeOut;
    const jsSource = options.jsSource;
    const logprobs = options.logprobs;
    const topLogprobs = (0, core_1.normalizeInt)(options.topLogprobs);
    const fenceFormat = options.fenceFormat;
    (0, core_1.assert)(!!runDir);
    if (options.json)
        (0, core_1.overrideStdoutWithStdErr)();
    (0, core_1.applyModelOptions)(options, "cli");
    const fail = (msg, exitCode, url) => {
        (0, core_1.logError)(url ? `${msg} (see ${url})` : msg);
        trace?.error(msg);
        return { exitCode, result };
    };
    (0, core_1.logInfo)(`genaiscript: ${scriptId}`);
    dbg(`run id: %s`, runId);
    dbg(`ci: %s`, core_1.isCI);
    // manage out folder
    if (removeOut)
        await (0, core_1.rmDir)(runDir);
    await (0, core_1.ensureDir)(runDir);
    const toolFiles = [];
    const resourceScript = await (0, core_1.tryResolveScript)(scriptId, {
        trace,
        cancellationToken,
    });
    if (resourceScript) {
        scriptId = resourceScript;
        dbg(`resolved script file: %s`, scriptId);
        toolFiles.push(scriptId);
    }
    else if (core_1.GENAI_ANY_REGEX.test(scriptId))
        toolFiles.push(scriptId);
    const prj = await (0, core_1.buildProject)({
        toolFiles,
    });
    if (jsSource) {
        prj.scripts.push({
            id: scriptId,
            ...(0, core_1.parsePromptScriptMeta)(jsSource),
            jsSource,
        });
    }
    const script = prj.scripts.find((t) => t.id === scriptId ||
        (t.filename && core_1.GENAI_ANY_REGEX.test(scriptId) && (0, node_path_1.resolve)(t.filename) === (0, node_path_1.resolve)(scriptId)));
    if (!script) {
        dbg(`script id not found: %s`, scriptId);
        dbg(`scripts: %O`, prj.scripts.map((s) => ({ id: s.id, filename: s.filename })));
        throw new Error(`script ${scriptId} not found`);
    }
    const outTraceFilename = options.runTrace === false || (core_1.isCI && !options.runTrace) || script.disableTrace
        ? undefined
        : await (0, core_1.setupTraceWriting)(trace, "trace", (0, node_path_1.join)(runDir, core_1.TRACE_FILENAME));
    const outputFilename = options.outputTrace === false || (core_1.isCI && !options.outputTrace)
        ? undefined
        : await (0, core_1.setupTraceWriting)(runOutputTrace, "output", (0, node_path_1.join)(runDir, core_1.OUTPUT_FILENAME), {
            ignoreInner: true,
        });
    if (outTrace && !/^false$/i.test(outTrace))
        await (0, core_1.setupTraceWriting)(trace, " trace", outTrace);
    if (outOutput && !/^false$/i.test(outOutput)) {
        await (0, core_1.setupTraceWriting)(runOutputTrace, " output", outOutput, {
            ignoreInner: true,
        });
    }
    const applyGitIgnore = options.ignoreGitIgnore !== true && script.ignoreGitIgnore !== true;
    dbg(`apply gitignore: ${applyGitIgnore}`);
    const ignorer = applyGitIgnore ? await (0, core_1.createGitIgnorer)() : undefined;
    const resolvedFiles = new Set();
    // move exclusions to excludedFiles
    excludedFiles.push(...files
        .filter((f) => core_1.NEGATIVE_GLOB_REGEX.test(f))
        .map((f) => f.replace(core_1.NEGATIVE_GLOB_REGEX, "")));
    files = files.filter((f) => !core_1.NEGATIVE_GLOB_REGEX.test(f));
    dbg(`files (remaining): %O`, files);
    for (let arg of files) {
        (0, core_1.checkCancelled)(cancellationToken);
        dbg(`resolving ${arg}`);
        const stat = await runtimeHost.statFile(arg);
        if (stat?.type === "file") {
            dbg(`file found %s`, arg);
            if (!ignorer?.([arg])?.length) {
                dbg(`ignored by gitignore`);
                continue;
            }
            resolvedFiles.add((0, core_1.filePathOrUrlToWorkspaceFile)(arg));
            continue;
        }
        const uriArg = (0, core_1.uriTryParse)(arg);
        if (uriArg) {
            dbg(`parsed uri %o`, uriArg);
            const resource = await (0, core_1.tryResolveResource)(arg, {
                trace,
                cancellationToken,
            });
            if (!resource)
                return fail(`resource ${arg} not found`, core_1.FILES_NOT_FOUND_ERROR_CODE);
            dbg(`resolved %d files`, resource.files.length);
            workspaceFiles.push(...resource.files);
            continue;
        }
        if (stat?.type === "directory") {
            arg = (0, node_path_1.join)(arg, "**", "*");
            dbg(`directory, updating to %s`, arg);
        }
        dbg(`expand ${arg} (apply .gitignore: ${applyGitIgnore})`);
        const ffs = await runtimeHost.findFiles(arg, {
            applyGitIgnore,
        });
        if (!ffs?.length && arg.includes("*")) {
            // edge case when gitignore dumps 1 file
            return fail(`no files matching ${arg} under ${process.cwd()} (all files might have been ignored)`, core_1.FILES_NOT_FOUND_ERROR_CODE);
        }
        for (const file of ffs) {
            resolvedFiles.add((0, core_1.filePathOrUrlToWorkspaceFile)(file));
        }
    }
    if (excludedFiles.length) {
        for (const arg of excludedFiles) {
            const ffs = await runtimeHost.findFiles(arg);
            for (const f of ffs) {
                dbg(`removing excluded file %s`, f);
                resolvedFiles.delete((0, core_1.filePathOrUrlToWorkspaceFile)(f));
            }
        }
    }
    // try reading stdin
    const stdin = await (0, core_1.readStdIn)();
    if (stdin) {
        dbg(`stdin: %s`, (0, core_1.ellipse)(stdin.content, 42));
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
            if (!exts.some((ext) => rf.endsWith(ext)))
                resolvedFiles.delete(rf);
        }
        workspaceFiles = workspaceFiles.filter(({ filename }) => exts.some((ext) => filename.endsWith(ext)));
        dbg(`filtered files: %d %d`, resolvedFiles.size, workspaceFiles.length);
    }
    const reasoningEndMarker = (0, core_1.wrapColor)(core_1.CONSOLE_COLOR_REASONING, core_1.REASONING_END_MARKER);
    const reasoningStartMarker = (0, core_1.wrapColor)(core_1.CONSOLE_COLOR_REASONING, core_1.REASONING_START_MARKER);
    let tokenColor = 0;
    let reasoningOutput = false;
    runOutputTrace.addEventListener(core_1.TRACE_CHUNK, (ev) => {
        const { progress, chunk } = ev;
        if (progress) {
            const { responseChunk, responseTokens, inner, reasoningChunk } = progress;
            if (!core_1.isQuiet &&
                reasoningChunk !== undefined &&
                reasoningChunk !== null &&
                reasoningChunk !== "") {
                if (!reasoningOutput)
                    core_1.stderr.write(reasoningStartMarker);
                reasoningOutput = true;
                core_1.stderr.write((0, core_1.wrapColor)(core_1.CONSOLE_COLOR_REASONING, reasoningChunk));
            }
            if (responseChunk !== undefined && responseChunk !== null && responseChunk !== "") {
                if (reasoningOutput) {
                    core_1.stderr.write(reasoningEndMarker);
                    reasoningOutput = false;
                }
                if (stream) {
                    if (responseTokens && core_1.consoleColors) {
                        const colors = inner ? core_1.CONSOLE_TOKEN_INNER_COLORS : core_1.CONSOLE_TOKEN_COLORS;
                        for (const token of responseTokens) {
                            if (!isNaN(token.logprob)) {
                                const c = (0, core_1.wrapRgbColor)((0, core_1.logprobColor)(token), token.token);
                                core_1.stdout.write(c);
                            }
                            else {
                                tokenColor = (tokenColor + 1) % colors.length;
                                const c = colors[tokenColor];
                                core_1.stdout.write((0, core_1.wrapColor)(c, token.token));
                            }
                        }
                    }
                    else {
                        if (!inner)
                            core_1.stdout.write(responseChunk);
                        else {
                            core_1.stderr.write((0, core_1.wrapColor)(core_1.CONSOLE_COLOR_DEBUG, responseChunk));
                        }
                    }
                }
                else if (!core_1.isQuiet) {
                    core_1.stderr.write((0, core_1.wrapColor)(core_1.CONSOLE_COLOR_DEBUG, responseChunk));
                }
            }
        }
        else if (!core_1.isQuiet && chunk !== undefined && chunk !== null && chunk !== "") {
            if (reasoningOutput) {
                core_1.stderr.write(reasoningEndMarker);
                reasoningOutput = false;
            }
            core_1.stdout.write(chunk);
        }
    });
    const fragment = {
        files: Array.from(resolvedFiles),
        workspaceFiles,
    };
    dbg(`files: %O\n workspace files: %O`, fragment.files, fragment.workspaceFiles.map((f) => f.filename));
    const vars = (0, core_1.parseOptionsVars)(options.vars, process.env);
    dbg(`vars: %o`, Object.keys(vars));
    const stats = new core_1.GenerationStats("");
    const userState = {};
    try {
        if (options.label)
            trace.heading(2, options.label);
        (0, core_1.applyScriptModelAliases)(script);
        (0, core_1.logModelAliases)();
        const { info } = await (0, core_1.resolveModelConnectionInfo)(script, {
            trace,
            model: options.model,
            defaultModel: core_1.LARGE_MODEL_ID,
            token: true,
        });
        if (info.error) {
            trace.error(undefined, info.error);
            return fail(info.error ?? "invalid model configuration", core_1.CONFIGURATION_ERROR_CODE, core_1.DOCS_CONFIGURATION_URL);
        }
        result = await (0, core_1.runTemplate)(prj, script, fragment, {
            runId,
            inner: false,
            infoCb: (args) => {
                const { text } = args;
                if (text) {
                    if (!core_1.isQuiet)
                        (0, core_1.logInfo)(text);
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
            stats,
            userState,
        });
    }
    catch (err) {
        stats.log();
        if ((0, core_1.isCancelError)(err))
            return fail("user cancelled", core_1.USER_CANCELLED_ERROR_CODE);
        (0, core_1.logError)(err);
        return fail("runtime error", core_1.RUNTIME_ERROR_CODE);
    }
    dbg(`result: %s`, result.finishReason);
    dbg(`annotations: %d`, result.annotations?.length);
    await aggregateResults(scriptId, outTrace, stats, result);
    await (0, core_1.traceAgentMemory)({ userState, trace });
    if (outAnnotations && result.annotations?.length) {
        if ((0, core_1.isJSONLFilename)(outAnnotations))
            await (0, core_1.appendJSONL)(outAnnotations, result.annotations);
        else {
            await (0, core_1.writeText)(outAnnotations, core_1.CSV_REGEX.test(outAnnotations)
                ? (0, core_1.diagnosticsToCSV)(result.annotations, csvSeparator)
                : /\.ya?ml$/i.test(outAnnotations)
                    ? (0, core_1.YAMLStringify)(result.annotations)
                    : /\.sarif$/i.test(outAnnotations)
                        ? await (0, core_1.convertDiagnosticsToSARIF)(script, result.annotations)
                        : JSON.stringify(result.annotations, null, 2));
        }
    }
    if (outChangelogs && result.changelogs?.length) {
        await (0, core_1.writeText)(outChangelogs, result.changelogs.join("\n"));
    }
    if (outData && result.frames?.length) {
        if ((0, core_1.isJSONLFilename)(outData))
            await (0, core_1.appendJSONL)(outData, result.frames);
        else
            await (0, core_1.writeText)(outData, JSON.stringify(result.frames, null, 2));
    }
    await (0, core_1.writeFileEdits)(result.fileEdits, { applyEdits, trace });
    const promptjson = result.messages?.length ? JSON.stringify(result.messages, null, 2) : undefined;
    const jsonf = (0, node_path_1.join)(runDir, `res.json`);
    const yamlf = (0, node_path_1.join)(runDir, `res.yaml`);
    const mkfn = (ext) => jsonf.replace(/\.json$/i, ext);
    const promptf = mkfn(".prompt.json");
    const outputjson = mkfn(".output.json");
    const outputyaml = mkfn(".output.yaml");
    const annotationf = result.annotations?.length ? mkfn(".annotations.csv") : undefined;
    const sariff = result.annotations?.length ? mkfn(".sarif") : undefined;
    const changelogf = result.changelogs?.length ? mkfn(".changelog.txt") : undefined;
    await (0, core_1.writeText)(jsonf, JSON.stringify(result, null, 2));
    await (0, core_1.writeText)(yamlf, (0, core_1.YAMLStringify)(result));
    if (promptjson)
        await (0, core_1.writeText)(promptf, promptjson);
    if (result.json) {
        await (0, core_1.writeText)(outputjson, JSON.stringify(result.json, null, 2));
        await (0, core_1.writeText)(outputyaml, (0, core_1.YAMLStringify)(result.json));
    }
    if (result.schemas) {
        for (const [sname, schema] of Object.entries(result.schemas)) {
            await (0, core_1.writeText)((0, node_path_1.join)(runDir, `${sname.toLocaleLowerCase()}.schema.ts`), (0, core_1.JSONSchemaStringifyToTypeScript)(schema, {
                typeName: (0, core_1.capitalize)(sname),
                export: true,
            }));
            await (0, core_1.writeText)((0, node_path_1.join)(runDir, `${sname.toLocaleLowerCase()}.schema.json`), (0, core_1.JSONSchemaStringify)(schema));
        }
    }
    if (annotationf) {
        await (0, core_1.writeText)(annotationf, `severity, filename, start, end, message\n` +
            result.annotations
                .map(({ severity, filename, range, message }) => `${severity}, ${filename}, ${range[0][0]}, ${range[1][0]}, ${message} `)
                .join("\n"));
    }
    if (sariff)
        await (0, core_1.writeText)(sariff, await (0, core_1.convertDiagnosticsToSARIF)(script, result.annotations));
    if (changelogf && result.changelogs?.length) {
        await (0, core_1.writeText)(changelogf, result.changelogs.join("\n"));
    }
    for (const [filename, edits] of Object.entries(result.fileEdits || {})) {
        const rel = (0, node_path_1.relative)(process.cwd(), filename);
        const isAbsolutePath = (0, node_path_1.resolve)(rel) === rel;
        if (!isAbsolutePath)
            await (0, core_1.writeText)((0, node_path_1.join)(runDir, core_1.CLI_RUN_FILES_FOLDER, rel), edits.after);
    }
    if (options.json && result !== undefined) {
        // needs to go to process.stdout
        core_1.stdout.write(JSON.stringify(result, null, 2));
    }
    let _ghInfo = undefined;
    const resolveGitHubInfo = async () => {
        if (!_ghInfo) {
            _ghInfo = await (0, core_1.githubParseEnv)(process.env, {
                resolveToken: true,
                resolveIssue: true,
                resolveCommit: true,
            });
        }
        return _ghInfo;
    };
    let adoInfo = undefined;
    if (teamsMessage && result.text) {
        const ghInfo = await resolveGitHubInfo();
        const channelURL = process.env.GENAISCRIPT_TEAMS_CHANNEL_URL || process.env.TEAMS_CHANNEL_URL;
        if (channelURL &&
            (await (0, runtime_1.confirmOrSkipInCI)("Would you like to post to Teams?", {
                preview: result.text,
            }))) {
            await (0, core_1.microsoftTeamsChannelPostMessage)(channelURL, (0, core_1.prettifyMarkdown)(result.text), {
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
        if (ghInfo.repository &&
            ghInfo.issue &&
            (await (0, runtime_1.confirmOrSkipInCI)("Would you like to add a pull request comment?", {
                preview: result.text,
            }))) {
            await (0, core_1.githubCreateIssueComment)(script, ghInfo, result.text, typeof pullRequestComment === "string" ? pullRequestComment : script.id, { cancellationToken, stats });
        }
        else {
            adoInfo = adoInfo ?? (await (0, core_1.azureDevOpsParseEnv)(process.env));
            if (adoInfo.collectionUri &&
                (await (0, runtime_1.confirmOrSkipInCI)("Would you like to add a pull request comment?", {
                    preview: result.text,
                }))) {
                await (0, core_1.azureDevOpsCreateIssueComment)(script, adoInfo, (0, core_1.prettifyMarkdown)(result.text), typeof pullRequestComment === "string" ? pullRequestComment : script.id);
            }
            else
                (0, core_1.logError)("pull request comment: no pull request information found");
        }
    }
    if (pullRequestDescription && result.text) {
        // github action or repo
        const ghInfo = await resolveGitHubInfo();
        if (ghInfo.repository &&
            ghInfo.issue &&
            (await (0, runtime_1.confirmOrSkipInCI)("Would you like to update the pull request description?", {
                preview: result.text,
            }))) {
            await (0, core_1.githubUpdatePullRequestDescription)(script, ghInfo, (0, core_1.prettifyMarkdown)(result.text), typeof pullRequestDescription === "string" ? pullRequestDescription : script.id, { cancellationToken });
        }
        else {
            // azure devops pipeline
            adoInfo = adoInfo ?? (await (0, core_1.azureDevOpsParseEnv)(process.env));
            if (adoInfo.collectionUri &&
                (await (0, runtime_1.confirmOrSkipInCI)("Would you like to update the pull request description?", {
                    preview: result.text,
                }))) {
                await (0, core_1.azureDevOpsUpdatePullRequestDescription)(script, adoInfo, (0, core_1.prettifyMarkdown)(result.text), typeof pullRequestDescription === "string" ? pullRequestDescription : script.id);
            }
            else {
                (0, core_1.logError)("pull request description: no pull request information found");
            }
        }
    }
    if (pullRequestReviews && result.annotations?.length) {
        dbg(`adding pull request reviews`);
        const ghInfo = await resolveGitHubInfo();
        if (ghInfo.repository && ghInfo.issue) {
            if (!ghInfo.commitSha)
                dbg(`no commit sha found, skipping pull request reviews`);
            else {
                await (0, core_1.githubCreatePullRequestReviews)(script, ghInfo, result.annotations, {
                    cancellationToken,
                });
            }
        }
    }
    if (result.status === "success")
        (0, core_1.logInfo)(`genaiscript: ${result.status}`);
    else if (result.status === "cancelled")
        (0, core_1.logWarn)(`genaiscript: ${result.status}`);
    else
        (0, core_1.logError)(`genaiscript: ${result.status}`);
    stats.log();
    if (outTraceFilename)
        (0, core_1.logVerbose)(`   trace: ${outTraceFilename}`);
    if (outputFilename)
        (0, core_1.logVerbose)(`  output: ${outputFilename}`);
    if (result.status !== "success" && result.status !== "cancelled") {
        const msg = (0, core_1.errorMessage)(result.error) ?? result.statusText ?? result.finishReason;
        return fail(msg, core_1.RUNTIME_ERROR_CODE);
    }
    if (failOnErrors && result.annotations?.some((a) => a.severity === "error")) {
        return fail("error annotations found", core_1.ANNOTATION_ERROR_CODE);
    }
    return { exitCode: 0, result };
}
async function aggregateResults(scriptId, outTrace, stats, result) {
    const statsDir = await (0, core_1.createStatsDir)();
    const statsFile = (0, node_path_1.join)(statsDir, "runs.csv");
    if (!(await (0, core_1.tryStat)(statsFile))) {
        await (0, promises_1.writeFile)(statsFile, [
            "script",
            "status",
            "cost",
            "total_tokens",
            "prompt_tokens",
            "completion_tokens",
            "trace",
            "version",
        ].join(",") + "\n", { encoding: "utf-8" });
    }
    const acc = stats.accumulatedUsage();
    await (0, promises_1.appendFile)(statsFile, [
        scriptId,
        result.status,
        stats.cost(),
        acc.total_tokens,
        acc.prompt_tokens,
        acc.completion_tokens,
        outTrace ? (0, node_path_1.basename)(outTrace) : "",
        result.version,
    ]
        .map((s) => String(s))
        .join(",") + "\n", { encoding: "utf-8" });
}
//# sourceMappingURL=run.js.map