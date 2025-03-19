import { capitalize } from "inflection"
import { resolve, join, relative } from "node:path"
import { isQuiet } from "./log"
import { emptyDir, ensureDir, exists } from "fs-extra"
import { convertDiagnosticsToSARIF } from "./sarif"
import { buildProject } from "./build"
import { diagnosticsToCSV } from "../../core/src/ast"
import { CancellationOptions } from "../../core/src/cancellation"
import { ChatCompletionsProgressReport } from "../../core/src/chattypes"
import { runTemplate } from "../../core/src/promptrunner"
import {
    githubCreateIssueComment,
    githubCreatePullRequestReviews,
    githubUpdatePullRequestDescription,
    githubParseEnv,
    GithubConnectionInfo,
} from "../../core/src/github"
import {
    HTTPS_REGEX,
    FILES_NOT_FOUND_ERROR_CODE,
    CONFIGURATION_ERROR_CODE,
    USER_CANCELLED_ERROR_CODE,
    RUNTIME_ERROR_CODE,
    CSV_REGEX,
    CLI_RUN_FILES_FOLDER,
    ANNOTATION_ERROR_CODE,
    GENAI_ANY_REGEX,
    UNRECOVERABLE_ERROR_CODES,
    SUCCESS_ERROR_CODE,
    RUNS_DIR_NAME,
    CONSOLE_COLOR_DEBUG,
    DOCS_CONFIGURATION_URL,
    STATS_DIR_NAME,
    GENAI_ANYTS_REGEX,
    CONSOLE_TOKEN_COLORS,
    CONSOLE_TOKEN_INNER_COLORS,
    TRACE_CHUNK,
    OUTPUT_FILENAME,
    TRACE_FILENAME,
    CONSOLE_COLOR_REASONING,
    REASONING_END_MARKER,
    REASONING_START_MARKER,
    LARGE_MODEL_ID,
    SERVER_PORT,
    SERVER_LOCALHOST,
    NEGATIVE_GLOB_REGEX,
} from "../../core/src/constants"
import { isCancelError, errorMessage } from "../../core/src/error"
import { GenerationResult } from "../../core/src/server/messages"
import { filePathOrUrlToWorkspaceFile, writeText } from "../../core/src/fs"
import { host, runtimeHost } from "../../core/src/host"
import { isJSONLFilename, appendJSONL } from "../../core/src/jsonl"
import { resolveModelConnectionInfo } from "../../core/src/models"
import {
    JSONSchemaStringifyToTypeScript,
    JSONSchemaStringify,
} from "../../core/src/schema"
import {
    TraceOptions,
    MarkdownTrace,
    TraceChunkEvent,
} from "../../core/src/trace"
import {
    logVerbose,
    logError,
    dotGenaiscriptPath,
    logInfo,
    logWarn,
    assert,
} from "../../core/src/util"
import { YAMLStringify } from "../../core/src/yaml"
import { PromptScriptRunOptions } from "../../core/src/server/messages"
import { writeFileEdits } from "../../core/src/fileedits"
import {
    azureDevOpsCreateIssueComment,
    AzureDevOpsEnv,
    azureDevOpsParseEnv,
    azureDevOpsUpdatePullRequestDescription,
} from "../../core/src/azuredevops"
import { writeFile } from "fs/promises"
import { prettifyMarkdown } from "../../core/src/markdown"
import { delay } from "es-toolkit"
import { GenerationStats } from "../../core/src/usage"
import { traceAgentMemory } from "../../core/src/agent"
import { appendFile } from "node:fs/promises"
import { parseOptionsVars } from "./vars"
import { logprobColor } from "../../core/src/logprob"
import {
    overrideStdoutWithStdErr,
    stderr,
    stdout,
} from "../../core/src/logging"
import { ensureDotGenaiscriptPath, setupTraceWriting } from "./trace"
import {
    applyModelOptions,
    applyScriptModelAliases,
    logModelAliases,
} from "../../core/src/modelalias"
import { createCancellationController } from "./cancel"
import { parsePromptScriptMeta } from "../../core/src/template"
import { Fragment } from "../../core/src/generation"
import { randomHex } from "../../core/src/crypto"
import { normalizeFloat, normalizeInt } from "../../core/src/cleaners"
import { microsoftTeamsChannelPostMessage } from "../../core/src/teams"
import { confirmOrSkipInCI } from "./ci"
import { readStdIn } from "./stdin"
import {
    consoleColors,
    wrapColor,
    wrapRgbColor,
} from "../../core/src/consolecolor"
import { generateId } from "../../core/src/id"
import { originalConsole } from "../../core/src/global"

function getRunDir(scriptId: string, runId: string) {
    const name = new Date().toISOString().replace(/[:.]/g, "-") + "-" + runId
    const out = dotGenaiscriptPath(
        RUNS_DIR_NAME,
        host.path.basename(scriptId).replace(GENAI_ANYTS_REGEX, ""),
        name
    )
    return out
}

export async function runScriptWithExitCode(
    scriptId: string,
    files: string[],
    options: Partial<PromptScriptRunOptions> & TraceOptions
) {
    await ensureDotGenaiscriptPath()
    const canceller = createCancellationController()
    const cancellationToken = canceller.token

    const runRetry = Math.max(1, normalizeInt(options.runRetry) || 1)
    let exitCode = -1
    for (let r = 0; r < runRetry; ++r) {
        if (cancellationToken.isCancellationRequested) break

        const res = await runScriptInternal(scriptId, files, {
            ...options,
            cancellationToken,
            cli: true,
        })
        exitCode = res.exitCode
        if (
            exitCode === SUCCESS_ERROR_CODE ||
            UNRECOVERABLE_ERROR_CODES.includes(exitCode)
        )
            break

        const delayMs = 2000 * Math.pow(2, r)
        if (runRetry > 1) {
            console.error(
                `error: run failed with ${exitCode}, retry #${r + 1}/${runRetry} in ${delayMs}ms`
            )
            await delay(delayMs)
        }
    }
    if (cancellationToken.isCancellationRequested)
        exitCode = USER_CANCELLED_ERROR_CODE
    process.exit(exitCode)
}

export async function runScriptInternal(
    scriptId: string,
    files: string[],
    options: Partial<PromptScriptRunOptions> &
        TraceOptions &
        CancellationOptions & {
            runId?: string
            outputTrace?: MarkdownTrace
            cli?: boolean
            infoCb?: (partialResponse: { text: string }) => void
            partialCb?: (progress: ChatCompletionsProgressReport) => void
        }
): Promise<{ exitCode: number; result?: GenerationResult }> {
    const runId = options.runId || generateId()
    const runDir = options.out || getRunDir(scriptId, runId)
    const cancellationToken = options.cancellationToken
    const {
        trace = new MarkdownTrace({ cancellationToken, dir: runDir }),
        outputTrace = new MarkdownTrace({ cancellationToken, dir: runDir }),
        infoCb,
        partialCb,
    } = options || {}

    runtimeHost.clearModelAlias("script")
    let result: GenerationResult
    const workspaceFiles = options.workspaceFiles || []
    const excludedFiles = options.excludedFiles || []
    const stream = !options.json && !options.yaml
    const retry = normalizeInt(options.retry) || 8
    const retryDelay = normalizeInt(options.retryDelay) || 15000
    const maxDelay = normalizeInt(options.maxDelay) || 180000
    const outTrace = options.outTrace
    const outOutput = options.outOutput
    const outAnnotations = options.outAnnotations
    const failOnErrors = options.failOnErrors
    const outChangelogs = options.outChangelogs
    const pullRequest = normalizeInt(options.pullRequest)
    const pullRequestComment = options.pullRequestComment
    const pullRequestDescription = options.pullRequestDescription
    const pullRequestReviews = options.pullRequestReviews
    const teamsMessage = options.teamsMessage
    const outData = options.outData
    const label = options.label
    const temperature = normalizeFloat(options.temperature)
    const fallbackTools = options.fallbackTools
    const reasoningEffort = options.reasoningEffort
    const topP = normalizeFloat(options.topP)
    const seed = normalizeFloat(options.seed)
    const maxTokens = normalizeInt(options.maxTokens)
    const maxToolCalls = normalizeInt(options.maxToolCalls)
    const maxDataRepairs = normalizeInt(options.maxDataRepairs)
    const cache = options.cacheName ?? options.cache
    const applyEdits = !!options.applyEdits
    const csvSeparator = options.csvSeparator || "\t"
    const removeOut = options.removeOut
    const jsSource = options.jsSource
    const logprobs = options.logprobs
    const topLogprobs = normalizeInt(options.topLogprobs)
    const fenceFormat = options.fenceFormat

    assert(!!runDir)

    if (options.json || options.yaml) overrideStdoutWithStdErr()
    applyModelOptions(options, "cli")

    const fail = (msg: string, exitCode: number, url?: string) => {
        logError(url ? `${msg} (see ${url})` : msg)
        trace?.error(msg)
        return { exitCode, result }
    }

    logInfo(`genaiscript: ${scriptId} (run: ${runId})`)

    // manage out folder
    if (removeOut) await emptyDir(runDir)
    await ensureDir(runDir)

    const outTraceFilename =
        options.runTrace === false
            ? undefined
            : await setupTraceWriting(
                  trace,
                  "trace",
                  join(runDir, TRACE_FILENAME)
              )
    const outputFilename =
        options.runTrace === false
            ? undefined
            : await setupTraceWriting(
                  outputTrace,
                  "output",
                  join(runDir, OUTPUT_FILENAME),
                  { ignoreInner: true }
              )
    if (outTrace && !/^false$/i.test(outTrace))
        await setupTraceWriting(trace, " trace", outTrace)
    if (outOutput && !/^false$/i.test(outOutput))
        await setupTraceWriting(outputTrace, " output", outOutput, {
            ignoreInner: true,
        })
    if (outTraceFilename)
        logVerbose(
            `viewer: ${SERVER_LOCALHOST}:${SERVER_PORT}/#runid=${runId}  (to start server, run 'genaiscript serve')`
        )

    const toolFiles: string[] = []
    if (GENAI_ANY_REGEX.test(scriptId)) toolFiles.push(scriptId)

    const prj = await buildProject({
        toolFiles,
    })
    if (jsSource)
        prj.scripts.push({
            id: scriptId,
            ...parsePromptScriptMeta(jsSource),
            jsSource,
        })
    const script = prj.scripts.find(
        (t) =>
            t.id === scriptId ||
            (t.filename &&
                GENAI_ANY_REGEX.test(scriptId) &&
                resolve(t.filename) === resolve(scriptId))
    )
    if (!script) throw new Error(`script ${scriptId} not found`)
    const applyGitIgnore =
        options.ignoreGitIgnore !== true && script.ignoreGitIgnore !== true
    const resolvedFiles = new Set<string>()
    // move exlucsions to excludedFiles
    excludedFiles.push(
        ...files
            .filter((f) => NEGATIVE_GLOB_REGEX.test(f))
            .map((f) => f.replace(NEGATIVE_GLOB_REGEX, ""))
    )
    files = files.filter((f) => !NEGATIVE_GLOB_REGEX.test(f))
    for (let arg of files) {
        if (HTTPS_REGEX.test(arg)) {
            resolvedFiles.add(arg)
            continue
        }
        const stats = await host.statFile(arg)
        if (stats?.type === "directory") arg = host.path.join(arg, "**", "*")
        const ffs = await host.findFiles(arg, {
            applyGitIgnore,
        })
        if (!ffs?.length) {
            return fail(
                `no files matching ${arg} under ${process.cwd()} (all files might have been ignored)`,
                FILES_NOT_FOUND_ERROR_CODE
            )
        }
        for (const file of ffs) {
            resolvedFiles.add(filePathOrUrlToWorkspaceFile(file))
        }
    }

    if (excludedFiles.length) {
        for (const arg of excludedFiles) {
            const ffs = await host.findFiles(arg)
            for (const f of ffs)
                resolvedFiles.delete(filePathOrUrlToWorkspaceFile(f))
        }
    }

    // try reading stdin
    const stdin = await readStdIn()
    if (stdin) workspaceFiles.push(stdin)

    if (script.accept) {
        const exts = script.accept
            .split(",")
            .map((s) => s.trim().replace(/^\*\./, "."))
            .filter((s) => !!s)
        for (const rf of resolvedFiles) {
            if (!exts.some((ext) => rf.endsWith(ext))) resolvedFiles.delete(rf)
        }
    }

    const reasoningEndMarker = wrapColor(
        CONSOLE_COLOR_REASONING,
        REASONING_END_MARKER
    )
    const reasoningStartMarker = wrapColor(
        CONSOLE_COLOR_REASONING,
        REASONING_START_MARKER
    )
    let tokenColor = 0
    let reasoningOutput = false
    outputTrace.addEventListener(TRACE_CHUNK, (ev) => {
        const { progress, chunk } = ev as TraceChunkEvent
        if (progress) {
            const { responseChunk, responseTokens, inner, reasoningChunk } =
                progress
            if (
                !isQuiet &&
                reasoningChunk !== undefined &&
                reasoningChunk !== null &&
                reasoningChunk !== ""
            ) {
                if (!reasoningOutput) stderr.write(reasoningStartMarker)
                reasoningOutput = true
                stderr.write(wrapColor(CONSOLE_COLOR_REASONING, reasoningChunk))
            }
            if (
                responseChunk !== undefined &&
                responseChunk !== null &&
                responseChunk !== ""
            ) {
                if (reasoningOutput) {
                    stderr.write(reasoningEndMarker)
                    reasoningOutput = false
                }
                if (stream) {
                    if (responseTokens && consoleColors) {
                        const colors = inner
                            ? CONSOLE_TOKEN_INNER_COLORS
                            : CONSOLE_TOKEN_COLORS
                        for (const token of responseTokens) {
                            if (!isNaN(token.logprob)) {
                                const c = wrapRgbColor(
                                    logprobColor(token),
                                    token.token
                                )
                                stdout.write(c)
                            } else {
                                tokenColor = (tokenColor + 1) % colors.length
                                const c = colors[tokenColor]
                                stdout.write(wrapColor(c, token.token))
                            }
                        }
                    } else {
                        if (!inner) stdout.write(responseChunk)
                        else {
                            stderr.write(
                                wrapColor(CONSOLE_COLOR_DEBUG, responseChunk)
                            )
                        }
                    }
                } else if (!isQuiet) {
                    stderr.write(wrapColor(CONSOLE_COLOR_DEBUG, responseChunk))
                }
            }
        } else if (
            !isQuiet &&
            chunk !== undefined &&
            chunk !== null &&
            chunk !== ""
        ) {
            if (reasoningOutput) {
                stderr.write(reasoningEndMarker)
                reasoningOutput = false
            }
            stdout.write(chunk)
        }
    })

    const fragment: Fragment = {
        files: Array.from(resolvedFiles),
        workspaceFiles,
    }
    const vars = Array.isArray(options.vars)
        ? parseOptionsVars(options.vars, process.env)
        : structuredClone(options.vars || {})
    const stats = new GenerationStats("")
    const userState: Record<string, any> = {}
    try {
        if (options.label) trace.heading(2, options.label)
        applyScriptModelAliases(script)
        logModelAliases()
        const { info } = await resolveModelConnectionInfo(script, {
            trace,
            model: options.model,
            defaultModel: LARGE_MODEL_ID,
            token: true,
        })
        if (info.error) {
            trace.error(undefined, info.error)
            return fail(
                info.error ?? "invalid model configuration",
                CONFIGURATION_ERROR_CODE,
                DOCS_CONFIGURATION_URL
            )
        }

        result = await runTemplate(prj, script, fragment, {
            inner: false,
            infoCb: (args) => {
                const { text } = args
                if (text) {
                    if (!isQuiet) logInfo(text)
                    infoCb?.(args)
                }
            },
            partialCb: (args) => {
                outputTrace.chatProgress(args)
                partialCb?.(args)
            },
            label,
            cache,
            temperature,
            reasoningEffort,
            topP,
            seed,
            cancellationToken,
            maxTokens,
            maxToolCalls,
            maxDataRepairs,
            model: info.model,
            embeddingsModel: options.embeddingsModel,
            retry,
            retryDelay,
            maxDelay,
            vars,
            trace,
            outputTrace,
            fallbackTools,
            logprobs,
            topLogprobs,
            fenceFormat,
            runDir,
            cliInfo: options.cli
                ? {
                      files,
                  }
                : undefined,
            stats,
            userState,
        })
    } catch (err) {
        stats.log()
        if (isCancelError(err))
            return fail("user cancelled", USER_CANCELLED_ERROR_CODE)
        logError(err)
        return fail("runtime error", RUNTIME_ERROR_CODE)
    }

    await aggregateResults(scriptId, outTrace, stats, result)
    await traceAgentMemory({ userState, trace })

    if (outAnnotations && result.annotations?.length) {
        if (isJSONLFilename(outAnnotations))
            await appendJSONL(outAnnotations, result.annotations)
        else
            await writeText(
                outAnnotations,
                CSV_REGEX.test(outAnnotations)
                    ? diagnosticsToCSV(result.annotations, csvSeparator)
                    : /\.ya?ml$/i.test(outAnnotations)
                      ? YAMLStringify(result.annotations)
                      : /\.sarif$/i.test(outAnnotations)
                        ? convertDiagnosticsToSARIF(script, result.annotations)
                        : JSON.stringify(result.annotations, null, 2)
            )
    }
    if (outChangelogs && result.changelogs?.length)
        await writeText(outChangelogs, result.changelogs.join("\n"))
    if (outData && result.frames?.length)
        if (isJSONLFilename(outData)) await appendJSONL(outData, result.frames)
        else await writeText(outData, JSON.stringify(result.frames, null, 2))

    await writeFileEdits(result.fileEdits, { applyEdits, trace })

    const promptjson = result.messages?.length
        ? JSON.stringify(result.messages, null, 2)
        : undefined
    const jsonf = join(runDir, `res.json`)
    const yamlf = join(runDir, `res.yaml`)

    const mkfn = (ext: string) => jsonf.replace(/\.json$/i, ext)
    const promptf = mkfn(".prompt.json")
    const outputjson = mkfn(".output.json")
    const outputyaml = mkfn(".output.yaml")
    const annotationf = result.annotations?.length
        ? mkfn(".annotations.csv")
        : undefined
    const sariff = result.annotations?.length ? mkfn(".sarif") : undefined
    const changelogf = result.changelogs?.length
        ? mkfn(".changelog.txt")
        : undefined
    await writeText(jsonf, JSON.stringify(result, null, 2))
    await writeText(yamlf, YAMLStringify(result))
    if (promptjson) await writeText(promptf, promptjson)
    if (result.json) {
        await writeText(outputjson, JSON.stringify(result.json, null, 2))
        await writeText(outputyaml, YAMLStringify(result.json))
    }
    if (result.schemas) {
        for (const [sname, schema] of Object.entries(result.schemas)) {
            await writeText(
                join(runDir, `${sname.toLocaleLowerCase()}.schema.ts`),
                JSONSchemaStringifyToTypeScript(schema, {
                    typeName: capitalize(sname),
                    export: true,
                })
            )
            await writeText(
                join(runDir, `${sname.toLocaleLowerCase()}.schema.json`),
                JSONSchemaStringify(schema)
            )
        }
    }
    if (annotationf) {
        await writeText(
            annotationf,
            `severity, filename, start, end, message\n` +
                result.annotations
                    .map(
                        ({ severity, filename, range, message }) =>
                            `${severity}, ${filename}, ${range[0][0]}, ${range[1][0]}, ${message} `
                    )
                    .join("\n")
        )
    }
    if (sariff)
        await writeText(
            sariff,
            convertDiagnosticsToSARIF(script, result.annotations)
        )
    if (changelogf && result.changelogs?.length)
        await writeText(changelogf, result.changelogs.join("\n"))
    for (const [filename, edits] of Object.entries(result.fileEdits || {})) {
        const rel = relative(process.cwd(), filename)
        const isAbsolutePath = resolve(rel) === rel
        if (!isAbsolutePath)
            await writeText(
                join(runDir, CLI_RUN_FILES_FOLDER, rel),
                edits.after
            )
    }

    if (options.json && result !== undefined)
        // needs to go to process.stdout
        process.stdout.write(JSON.stringify(result, null, 2))
    if (options.yaml && result !== undefined)
        // needs to go to process.stdout
        process.stdout.write(YAMLStringify(result))

    let _ghInfo: GithubConnectionInfo = undefined
    const resolveGitHubInfo = async () => {
        if (!_ghInfo)
            _ghInfo = await githubParseEnv(process.env, {
                issue: pullRequest,
                resolveIssue: true,
            })
        return _ghInfo
    }
    let adoInfo: AzureDevOpsEnv = undefined

    if (teamsMessage && result.text) {
        const ghInfo = await resolveGitHubInfo()
        const channelURL =
            process.env.GENAISCRIPT_TEAMS_CHANNEL_URL ||
            process.env.TEAMS_CHANNEL_URL
        if (
            channelURL &&
            (await confirmOrSkipInCI("Would you like to post to Teams?", {
                preview: result.text,
            }))
        ) {
            await microsoftTeamsChannelPostMessage(
                channelURL,
                prettifyMarkdown(result.text),
                {
                    script,
                    info: ghInfo,
                    cancellationToken,
                    trace,
                }
            )
        }
    }

    if (pullRequestReviews && result.annotations?.length) {
        // github action or repo
        const ghInfo = await resolveGitHubInfo()
        if (ghInfo.repository && ghInfo.issue && ghInfo.commitSha) {
            await githubCreatePullRequestReviews(
                script,
                ghInfo,
                result.annotations
            )
        }
    }

    if (pullRequestComment && result.text) {
        // github action or repo
        const ghInfo = await resolveGitHubInfo()
        if (
            ghInfo.repository &&
            ghInfo.issue &&
            (await confirmOrSkipInCI(
                "Would you like to add a pull request comment?",
                {
                    preview: result.text,
                }
            ))
        ) {
            await githubCreateIssueComment(
                script,
                ghInfo,
                prettifyMarkdown(result.text),
                typeof pullRequestComment === "string"
                    ? pullRequestComment
                    : script.id
            )
        } else {
            adoInfo = adoInfo ?? (await azureDevOpsParseEnv(process.env))
            if (
                adoInfo.collectionUri &&
                (await confirmOrSkipInCI(
                    "Would you like to add a pull request comment?",
                    {
                        preview: result.text,
                    }
                ))
            ) {
                await azureDevOpsCreateIssueComment(
                    script,
                    adoInfo,
                    prettifyMarkdown(result.text),
                    typeof pullRequestComment === "string"
                        ? pullRequestComment
                        : script.id
                )
            } else
                logError(
                    "pull request comment: no pull request information found"
                )
        }
    }

    if (pullRequestDescription && result.text) {
        // github action or repo
        const ghInfo = await resolveGitHubInfo()
        if (
            ghInfo.repository &&
            ghInfo.issue &&
            (await confirmOrSkipInCI(
                "Would you like to update the pull request description?",
                {
                    preview: result.text,
                }
            ))
        ) {
            await githubUpdatePullRequestDescription(
                script,
                ghInfo,
                prettifyMarkdown(result.text),
                typeof pullRequestDescription === "string"
                    ? pullRequestDescription
                    : script.id
            )
        } else {
            // azure devops pipeline
            adoInfo = adoInfo ?? (await azureDevOpsParseEnv(process.env))
            if (
                adoInfo.collectionUri &&
                (await confirmOrSkipInCI(
                    "Would you like to update the pull request description?",
                    {
                        preview: result.text,
                    }
                ))
            ) {
                await azureDevOpsUpdatePullRequestDescription(
                    script,
                    adoInfo,
                    prettifyMarkdown(result.text),
                    typeof pullRequestDescription === "string"
                        ? pullRequestDescription
                        : script.id
                )
            } else {
                logError(
                    "pull request description: no pull request information found"
                )
            }
        }
    }

    if (result.status === "success") logInfo(`genaiscript: ${result.status}`)
    else if (result.status === "cancelled")
        logWarn(`genaiscript: ${result.status}`)
    else logError(`genaiscript: ${result.status}`)
    stats.log()
    if (outTraceFilename) logVerbose(`   trace: ${outTraceFilename}`)
    if (outputFilename) logVerbose(`  output: ${outputFilename}`)
    if (outTraceFilename)
        logVerbose(
            `  viewer: ${SERVER_LOCALHOST}:${SERVER_PORT}/#runid=${runId}  (to start server, run 'genaiscript serve')`
        )

    if (result.status !== "success" && result.status !== "cancelled") {
        const msg =
            errorMessage(result.error) ??
            result.statusText ??
            result.finishReason
        return fail(msg, RUNTIME_ERROR_CODE)
    }

    if (failOnErrors && result.annotations?.some((a) => a.severity === "error"))
        return fail("error annotations found", ANNOTATION_ERROR_CODE)

    return { exitCode: 0, result }
}

async function aggregateResults(
    scriptId: string,
    outTrace: string,
    stats: GenerationStats,
    result: GenerationResult
) {
    const statsDir = dotGenaiscriptPath(STATS_DIR_NAME)
    await ensureDir(statsDir)
    const statsFile = host.path.join(statsDir, "runs.csv")
    if (!(await exists(statsFile)))
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
            { encoding: "utf-8" }
        )
    await appendFile(
        statsFile,
        [
            scriptId,
            result.status,
            stats.cost(),
            stats.usage.total_tokens,
            stats.usage.prompt_tokens,
            stats.usage.completion_tokens,
            outTrace ? host.path.basename(outTrace) : "",
            result.version,
        ]
            .map((s) => String(s))
            .join(",") + "\n",
        { encoding: "utf-8" }
    )
}
