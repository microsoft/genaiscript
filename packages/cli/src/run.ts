import { capitalize } from "inflection"
import path, { resolve, join, relative, dirname } from "node:path"
import { consoleColors, isQuiet, wrapColor, wrapRgbColor } from "./log"
import { emptyDir, ensureDir, appendFileSync, exists } from "fs-extra"
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
    TRACE_CHUNK,
    UNRECOVERABLE_ERROR_CODES,
    SUCCESS_ERROR_CODE,
    RUNS_DIR_NAME,
    CONSOLE_COLOR_DEBUG,
    DOCS_CONFIGURATION_URL,
    TRACE_DETAILS,
    STATS_DIR_NAME,
    GENAI_ANYTS_REGEX,
    CONSOLE_TOKEN_COLORS,
    CONSOLE_TOKEN_INNER_COLORS,
} from "../../core/src/constants"
import { isCancelError, errorMessage } from "../../core/src/error"
import { Fragment, GenerationResult } from "../../core/src/generation"
import { parseKeyValuePair } from "../../core/src/fence"
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
    normalizeFloat,
    normalizeInt,
    logVerbose,
    logError,
    dotGenaiscriptPath,
    logInfo,
    logWarn,
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
import { resolveTokenEncoder } from "../../core/src/encoders"
import { writeFile } from "fs/promises"
import { writeFileSync } from "node:fs"
import { prettifyMarkdown } from "../../core/src/markdown"
import { delay } from "es-toolkit"
import { GenerationStats } from "../../core/src/usage"
import { traceAgentMemory } from "../../core/src/agent"
import { appendFile } from "node:fs/promises"
import { parseOptionsVars } from "./vars"
import { logprobColor } from "../../core/src/logprob"
import { structuralMerge } from "../../core/src/merge"
import {
    overrideStdoutWithStdErr,
    stderr,
    stdout,
} from "../../core/src/logging"
import { setModelAlias } from "../../core/src/connection"

async function setupTraceWriting(trace: MarkdownTrace, filename: string) {
    logVerbose(`trace: ${filename}`)
    await ensureDir(dirname(filename))
    await writeFile(filename, "", { encoding: "utf-8" })
    trace.addEventListener(
        TRACE_CHUNK,
        (ev) => {
            const tev = ev as TraceChunkEvent
            appendFileSync(filename, tev.chunk, { encoding: "utf-8" })
        },
        false
    )
    trace.addEventListener(TRACE_DETAILS, (ev) => {
        const content = trace.content
        writeFileSync(filename, content, { encoding: "utf-8" })
    })
    return filename
}

async function ensureDotGenaiscriptPath() {
    const dir = dotGenaiscriptPath(".")
    if (await exists(dir)) return

    await ensureDir(dir)
    await writeFile(
        path.join(dir, ".gitattributes"),
        `# avoid merge issues and ignore files in diffs
*.json -diff merge=ours linguist-generated
*.jsonl -diff merge=ours linguist-generated        
*.js -diff merge=ours linguist-generated
`,
        { encoding: "utf-8" }
    )
    await writeFile(path.join(dir, ".gitignore"), "*\n", { encoding: "utf-8" })
}

export async function runScriptWithExitCode(
    scriptId: string,
    files: string[],
    options: Partial<PromptScriptRunOptions> &
        TraceOptions &
        CancellationOptions
) {
    await ensureDotGenaiscriptPath()
    const runRetry = Math.max(1, normalizeInt(options.runRetry) || 1)
    let exitCode = -1
    for (let r = 0; r < runRetry; ++r) {
        let outTrace = options.outTrace
        if (!outTrace)
            outTrace = dotGenaiscriptPath(
                RUNS_DIR_NAME,
                host.path.basename(scriptId).replace(GENAI_ANYTS_REGEX, ""),
                `${new Date().toISOString().replace(/[:.]/g, "-")}.trace.md`
            )
        const res = await runScriptInternal(scriptId, files, {
            ...options,
            outTrace,
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
    process.exit(exitCode)
}

export async function runScriptInternal(
    scriptId: string,
    files: string[],
    options: Partial<PromptScriptRunOptions> &
        TraceOptions &
        CancellationOptions & {
            infoCb?: (partialResponse: { text: string }) => void
            partialCb?: (progress: ChatCompletionsProgressReport) => void
        }
): Promise<{ exitCode: number; result?: GenerationResult }> {
    const { trace = new MarkdownTrace(), infoCb, partialCb } = options || {}
    let result: GenerationResult
    const excludedFiles = options.excludedFiles
    const excludeGitIgnore = !!options.excludeGitIgnore
    const out = options.out
    const stream = !options.json && !options.yaml && !out
    const retry = normalizeInt(options.retry) || 8
    const retryDelay = normalizeInt(options.retryDelay) || 15000
    const maxDelay = normalizeInt(options.maxDelay) || 180000
    const outTrace = options.outTrace
    const outAnnotations = options.outAnnotations
    const failOnErrors = options.failOnErrors
    const outChangelogs = options.outChangelogs
    const pullRequest = normalizeInt(options.pullRequest)
    const pullRequestComment = options.pullRequestComment
    const pullRequestDescription = options.pullRequestDescription
    const pullRequestReviews = options.pullRequestReviews
    const outData = options.outData
    const label = options.label
    const temperature = normalizeFloat(options.temperature)
    const topP = normalizeFloat(options.topP)
    const seed = normalizeFloat(options.seed)
    const maxTokens = normalizeInt(options.maxTokens)
    const maxToolCalls = normalizeInt(options.maxToolCalls)
    const maxDataRepairs = normalizeInt(options.maxDataRepairs)
    const cache = !!options.cache
    const applyEdits = !!options.applyEdits
    const csvSeparator = options.csvSeparator || "\t"
    const removeOut = options.removeOut
    const cacheName = options.cacheName
    const cancellationToken = options.cancellationToken
    const jsSource = options.jsSource
    const fallbackTools = !!options.fallbackTools
    const logprobs = options.logprobs
    const topLogprobs = normalizeInt(options.topLogprobs)
    const fenceFormat = options.fenceFormat

    if (options.json || options.yaml) overrideStdoutWithStdErr()
    if (options.model) runtimeHost.modelAliases.large.model = options.model
    if (options.smallModel)
        runtimeHost.modelAliases.small.model = options.smallModel
    if (options.visionModel)
        runtimeHost.modelAliases.vision.model = options.visionModel
    for (const kv of options.modelAlias || []) {
        const aliases = parseKeyValuePair(kv)
        for (const [key, value] of Object.entries(aliases))
            setModelAlias(key, value)
    }

    const fail = (msg: string, exitCode: number, url?: string) => {
        logError(url ? `${msg} (see ${url})` : msg)
        return { exitCode, result }
    }

    logInfo(`genaiscript: ${scriptId}`)

    if (out) {
        if (removeOut) await emptyDir(out)
        await ensureDir(out)
    }
    let outTraceFilename
    if (outTrace && !/^false$/i.test(outTrace) && trace)
        outTraceFilename = await setupTraceWriting(trace, outTrace)
    if (out && trace) {
        const ofn = join(out, "res.trace.md")
        if (ofn !== outTrace) {
            outTraceFilename = await setupTraceWriting(trace, ofn)
        }
    }

    const toolFiles: string[] = []
    const resolvedFiles = new Set<string>()

    if (GENAI_ANY_REGEX.test(scriptId)) toolFiles.push(scriptId)

    for (let arg of files) {
        if (HTTPS_REGEX.test(arg)) {
            resolvedFiles.add(arg)
            continue
        }
        const stats = await host.statFile(arg)
        if (stats?.type === "directory") arg = host.path.join(arg, "**", "*")
        const ffs = await host.findFiles(arg, {
            applyGitIgnore: excludeGitIgnore,
        })
        if (!ffs?.length) {
            return fail(
                `no files matching ${arg} under ${process.cwd()}`,
                FILES_NOT_FOUND_ERROR_CODE
            )
        }
        for (const file of ffs) {
            resolvedFiles.add(filePathOrUrlToWorkspaceFile(file))
        }
    }

    if (excludedFiles?.length) {
        for (const arg of excludedFiles) {
            const ffs = await host.findFiles(arg)
            for (const f of ffs)
                resolvedFiles.delete(filePathOrUrlToWorkspaceFile(f))
        }
    }

    const prj = await buildProject({
        toolFiles,
    })
    if (jsSource)
        prj.scripts.push({
            id: scriptId,
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
    const fragment: Fragment = {
        files: Array.from(resolvedFiles),
    }
    const vars = Array.isArray(options.vars)
        ? parseOptionsVars(options.vars, process.env)
        : structuredClone(options.vars || {})
    const stats = new GenerationStats("")
    try {
        if (options.label) trace.heading(2, options.label)
        const { info } = await resolveModelConnectionInfo(script, {
            trace,
            model: options.model,
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
        trace.options.encoder = (await resolveTokenEncoder(info.model)).encode

        let tokenColor = 0
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
                const { responseChunk, responseTokens, inner } = args
                if (responseChunk !== undefined) {
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
                                    tokenColor =
                                        (tokenColor + 1) % colors.length
                                    const c = colors[tokenColor]
                                    stdout.write(wrapColor(c, token.token))
                                }
                            }
                        } else {
                            if (!inner) stdout.write(responseChunk)
                            else
                                stderr.write(
                                    wrapColor(
                                        CONSOLE_COLOR_DEBUG,
                                        responseChunk
                                    )
                                )
                        }
                    } else if (!isQuiet)
                        stderr.write(
                            wrapColor(CONSOLE_COLOR_DEBUG, responseChunk)
                        )
                }
                partialCb?.(args)
            },
            label,
            cache,
            cacheName,
            temperature,
            topP,
            seed,
            cancellationToken,
            maxTokens,
            maxToolCalls,
            maxDataRepairs,
            model: info.model,
            embeddingsModel:
                options.embeddingsModel ??
                runtimeHost.modelAliases.embeddings.model,
            retry,
            retryDelay,
            maxDelay,
            vars,
            trace,
            fallbackTools,
            logprobs,
            topLogprobs,
            fenceFormat,
            cliInfo: {
                files,
            },
            stats,
        })
    } catch (err) {
        stats.log()
        if (isCancelError(err))
            return fail("user cancelled", USER_CANCELLED_ERROR_CODE)
        logError(err)
        return fail("runtime error", RUNTIME_ERROR_CODE)
    }

    await aggregateResults(scriptId, outTrace, stats, result)
    await traceAgentMemory(trace)

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
    if (out) {
        const jsonf = join(out, `res.json`)
        const yamlf = join(out, `res.yaml`)

        const mkfn = (ext: string) => jsonf.replace(/\.json$/i, ext)
        const promptf = mkfn(".prompt.json")
        const outputf = mkfn(".output.md")
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
        if (result.text) await writeText(outputf, result.text)
        if (result.schemas) {
            for (const [sname, schema] of Object.entries(result.schemas)) {
                await writeText(
                    join(out, `${sname.toLocaleLowerCase()}.schema.ts`),
                    JSONSchemaStringifyToTypeScript(schema, {
                        typeName: capitalize(sname),
                        export: true,
                    })
                )
                await writeText(
                    join(out, `${sname.toLocaleLowerCase()}.schema.json`),
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
        for (const [filename, edits] of Object.entries(
            result.fileEdits || {}
        )) {
            const rel = relative(process.cwd(), filename)
            const isAbsolutePath = resolve(rel) === rel
            if (!isAbsolutePath)
                await writeText(
                    join(out, CLI_RUN_FILES_FOLDER, rel),
                    edits.after
                )
        }
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
        if (ghInfo.repository && ghInfo.issue) {
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
            if (adoInfo.collectionUri) {
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
        if (ghInfo.repository && ghInfo.issue) {
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
            if (adoInfo.collectionUri) {
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
    if (outTraceFilename) logVerbose(`  trace: ${outTraceFilename}`)

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
