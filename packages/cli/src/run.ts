// cspell: disable
import { capitalize } from "inflection"
import path, { resolve, join, relative, dirname } from "node:path"
import { consoleColors, isQuiet, wrapColor } from "./log"
import { emptyDir, ensureDir, appendFileSync, exists, statSync } from "fs-extra"
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
import {
    GenerationResult,
    GenerationStatus,
    mergeGenerationStatus,
} from "../../core/src/generation"
import { filePathOrUrlToWorkspaceFile, writeText } from "../../core/src/fs"
import { host } from "../../core/src/host"
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
import { appendFile } from "node:fs/promises"
import { parseOptionsVars } from "./vars"
import { isGlobMatch } from "../../core/src/glob"

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
    trace.addEventListener(TRACE_DETAILS, () => {
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
    let {
        trace = new MarkdownTrace(),
        out,
        outTrace,
        removeOut,
        ...rest
    } = options

    if (out) {
        if (removeOut) await emptyDir(out)
        await ensureDir(out)
    }
    let outTraceFilename: string
    if (!/^false$/i.test(outTrace)) {
        if (!outTrace)
            outTrace = dotGenaiscriptPath(
                RUNS_DIR_NAME,
                host.path.basename(scriptId).replace(GENAI_ANYTS_REGEX, ""),
                `${new Date().toISOString().replace(/[:.]/g, "-")}.trace.md`
            )
        outTraceFilename = await setupTraceWriting(trace, outTrace)
    }
    const runRetry = Math.max(1, normalizeInt(options.runRetry) || 1)
    let exitCode = -1
    for (let r = 0; r < runRetry; ++r) {
        exitCode = await runScriptWithOutputs(scriptId, files, {
            ...rest,
            out,
            trace,
        })
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
    if (outTraceFilename) logVerbose(`  trace: ${outTraceFilename}`)
    process.exit(exitCode)
}

async function resolveFiles(
    files: string[],
    excludedFiles: string[],
    excludeGitIgnore: boolean,
    singleFile: string
) {
    const res = new Set<string>()
    for (let arg of files) {
        if (HTTPS_REGEX.test(arg)) res.add(arg)
        else {
            if (statSync(arg).isDirectory()) arg = path.join(arg, "/*")
            const ffs = await host.findFiles(arg, {
                applyGitIgnore: excludeGitIgnore,
            })
            if (!ffs?.length) {
                return {
                    error: `no files matching ${arg} under ${process.cwd()}`,
                    code: FILES_NOT_FOUND_ERROR_CODE,
                }
            }
            for (const file of ffs) {
                res.add(filePathOrUrlToWorkspaceFile(file))
            }
        }
    }

    if (excludedFiles?.length) {
        for (const arg of excludedFiles) {
            const ffs = await host.findFiles(arg)
            for (const f of ffs) res.delete(filePathOrUrlToWorkspaceFile(f))
        }
    }

    let resolvedFiles = Array.from(res)
    if (singleFile)
        resolvedFiles = resolvedFiles.filter((f) =>
            isGlobMatch(f, singleFile, { matchBase: true })
        )

    if (res.size) logVerbose(`files:\n${YAMLStringify(resolvedFiles)}`)

    return {
        resolvedFiles,
        code: SUCCESS_ERROR_CODE,
    }
}

async function computeFileChunks(
    files: string[],
    mode: "all" | "single"
): Promise<string[][]> {
    switch (mode || "") {
        case "single":
            return files.map((f) => [f])
        default:
            return [files]
    }
}

export async function runScript(
    scriptId: string,
    files: string[],
    options: Omit<Partial<PromptScriptRunOptions>, "outTrace" | "removeOut"> &
        TraceOptions &
        CancellationOptions & {
            infoCb?: (partialResponse: { text: string }) => void
            partialCb?: (progress: ChatCompletionsProgressReport) => void
            resultCb?: (result: GenerationResult) => void
            stats?: GenerationStats
        }
): Promise<{
    exitCode: number
    script: PromptScript
    results?: GenerationResult[]
}> {
    const {
        trace = new MarkdownTrace(),
        stats = new GenerationStats(""),
        infoCb,
        partialCb,
        resultCb,
    } = options || {}
    const excludedFiles = options.excludedFiles
    const excludeGitIgnore = !!options.excludeGitIgnore
    const out = options.out
    const stream = !options.json && !options.yaml && !out
    const retry = parseInt(options.retry) || 8
    const retryDelay = parseInt(options.retryDelay) || 15000
    const maxDelay = parseInt(options.maxDelay) || 180000
    const label = options.label
    const temperature = normalizeFloat(options.temperature)
    const topP = normalizeFloat(options.topP)
    const seed = normalizeFloat(options.seed)
    const maxTokens = normalizeInt(options.maxTokens)
    const maxToolCalls = normalizeInt(options.maxToolCalls)
    const maxDataRepairs = normalizeInt(options.maxDataRepairs)
    const cache = !!options.cache
    const cacheName = options.cacheName
    const cancellationToken = options.cancellationToken
    const jsSource = options.jsSource
    const singleFile = options.singleFile

    if (options.model) host.defaultModelOptions.model = options.model
    if (options.smallModel)
        host.defaultModelOptions.smallModel = options.smallModel

    const results: GenerationResult[] = []
    let script: PromptScript
    const fail = (msg: string, exitCode: number, url?: string) => {
        logError(url ? `${msg} (see ${url})` : msg)
        return { exitCode, script, results }
    }

    logInfo(`genaiscript: ${scriptId}`)

    const toolFiles: string[] = []
    const {
        resolvedFiles,
        code: resolvedFilesCode,
        error: resolvedFilesError,
    } = await resolveFiles(files, excludedFiles, excludeGitIgnore, singleFile)
    if (resolvedFilesError) return fail(resolvedFilesError, resolvedFilesCode)

    const prj = await buildProject({
        toolFiles,
    })
    if (jsSource)
        prj.templates.push({
            id: scriptId,
            jsSource,
        })
    script = prj.templates.find(
        (t) =>
            t.id === scriptId ||
            (t.filename &&
                GENAI_ANY_REGEX.test(scriptId) &&
                resolve(t.filename) === resolve(scriptId))
    )
    if (!script) throw new Error(`script ${scriptId} not found`)

    const vars = parseOptionsVars(options.vars, process.env)
    const fileChunks = await computeFileChunks(
        resolvedFiles,
        singleFile ? "single" : script.filesBatch
    )

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
        const model = info.model
        const embeddingsModel =
            options.embeddingsModel ??
            host.defaultEmbeddingsModelOptions.embeddingsModel

        for (const fileChunk of fileChunks) {
            if (fileChunks.length > 1 && fileChunk.length === 1)
                trace.heading(3, fileChunk[0])
            let tokenColor = 0
            const res = await runTemplate(
                prj,
                script,
                structuredClone({
                    files: resolvedFiles,
                }),
                {
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
                                        tokenColor =
                                            (tokenColor + 1) % colors.length
                                        const c = colors[tokenColor]
                                        process.stdout.write(
                                            wrapColor(c, token)
                                        )
                                    }
                                } else {
                                    if (!inner)
                                        process.stdout.write(responseChunk)
                                    else
                                        process.stderr.write(
                                            wrapColor(
                                                CONSOLE_COLOR_DEBUG,
                                                responseChunk
                                            )
                                        )
                                }
                            } else if (!isQuiet)
                                process.stderr.write(
                                    wrapColor(
                                        CONSOLE_COLOR_DEBUG,
                                        responseChunk
                                    )
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
                    model,
                    embeddingsModel,
                    retry,
                    retryDelay,
                    maxDelay,
                    vars,
                    trace,
                    cliInfo: {
                        files,
                    },
                    stats,
                }
            )
            results.push(res)
            stats.log()
            resultCb?.(res)
        }
        return { exitCode: SUCCESS_ERROR_CODE, script, results }
    } catch (err) {
        if (isCancelError(err))
            return fail("user cancelled", USER_CANCELLED_ERROR_CODE)
        logError(err)
        return fail("runtime error", RUNTIME_ERROR_CODE)
    }
}

async function runScriptWithOutputs(
    scriptId: string,
    files: string[],
    options: Partial<PromptScriptRunOptions> &
        TraceOptions &
        CancellationOptions & {
            infoCb?: (partialResponse: { text: string }) => void
            partialCb?: (progress: ChatCompletionsProgressReport) => void
        }
): Promise<number> {
    const { trace = new MarkdownTrace() } = options || {}
    const out = options.out
    const outAnnotations = options.outAnnotations
    const failOnErrors = options.failOnErrors
    const outChangelogs = options.outChangelogs
    const pullRequest = normalizeInt(options.pullRequest)
    const pullRequestComment = options.pullRequestComment
    const pullRequestDescription = options.pullRequestDescription
    const pullRequestReviews = options.pullRequestReviews
    const outData = options.outData
    const applyEdits = !!options.applyEdits
    const csvSeparator = options.csvSeparator || "\t"

    const res = await runScript(scriptId, files, {
        ...options,
        trace,
    })
    const { script, results = [] } = res

    const annotations = results.reduce(
        (vs, r) => vs.concat(r.annotations || []),
        [] as Diagnostic[]
    )
    const changelogs = results.reduce(
        (vs, r) => vs.concat(r.changelogs || []),
        [] as string[]
    )
    const frames = results.reduce<DataFrame[]>(
        (vs, r) => vs.concat(r.frames || []),
        [] as DataFrame[]
    )
    const fileEdits = results.reduce(
        (vs, r) => ({ ...vs, ...(r.fileEdits || {}) }),
        {} as Record<string, FileUpdate>
    )
    const output = results.reduce(
        (vs, r) => vs + `\n\n---\n\n` + r.text || "",
        ""
    )
    const schemas = results.reduce(
        (vs, r) =>
            vs.concat(
                Object.entries(r.schemas || {}).map(([name, schema]) => ({
                    name,
                    schema,
                }))
            ),
        [] as { name: string; schema: JSONSchema }[]
    )
    const status = results.reduce(
        (vs, r) => mergeGenerationStatus(vs, r.status),
        "success" as GenerationStatus
    )

    if (outAnnotations && annotations.length) {
        if (isJSONLFilename(outAnnotations))
            await appendJSONL(outAnnotations, annotations)
        else
            await writeText(
                outAnnotations,
                CSV_REGEX.test(outAnnotations)
                    ? diagnosticsToCSV(annotations, csvSeparator)
                    : /\.ya?ml$/i.test(outAnnotations)
                      ? YAMLStringify(annotations)
                      : /\.sarif$/i.test(outAnnotations)
                        ? convertDiagnosticsToSARIF(script, annotations)
                        : JSON.stringify(annotations, null, 2)
            )
    }

    if (outChangelogs && changelogs.length)
        await writeText(outChangelogs, changelogs.join("\n"))
    if (outData && frames.length)
        if (isJSONLFilename(outData)) await appendJSONL(outData, frames)
        else await writeText(outData, JSON.stringify(frames, null, 2))

    await writeFileEdits(fileEdits, { applyEdits, trace })

    if (out && results.length) {
        const jsonf = join(out, `res.json`)
        const mkfn = (ext: string) => jsonf.replace(/\.json$/i, ext)
        const yamlf = mkfn(".yaml")
        const annotationf = annotations.length
            ? mkfn(".annotations.csv")
            : undefined
        const sariff = annotations.length ? mkfn(".sarif") : undefined
        const changelogf = changelogs.length
            ? mkfn(".changelog.txt")
            : undefined
        const outputf = mkfn(".output.md")
        await writeText(jsonf, JSON.stringify(results, null, 2))
        await writeText(yamlf, YAMLStringify(results))
        if (annotationf) {
            await writeText(
                annotationf,
                `severity, filename, start, end, message\n` +
                    annotations
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
                convertDiagnosticsToSARIF(script, annotations)
            )
        if (changelogf && changelogs.length)
            await writeText(changelogf, changelogs.join("\n"))
        for (const [filename, edits] of Object.entries(fileEdits)) {
            const rel = relative(process.cwd(), filename)
            const isAbsolutePath = resolve(rel) === rel
            if (!isAbsolutePath)
                await writeText(
                    join(out, CLI_RUN_FILES_FOLDER, rel),
                    edits.after
                )
        }
        if (output) await writeText(outputf, output)
        for (const schema of schemas) {
            await writeText(
                join(out, `${schema.name.toLocaleLowerCase()}.schema.ts`),
                JSONSchemaStringifyToTypeScript(schema.schema, {
                    typeName: capitalize(schema.name),
                    export: true,
                })
            )
            await writeText(
                join(out, `${schema.name.toLocaleLowerCase()}.schema.json`),
                JSONSchemaStringify(schema.schema)
            )
        }

        const result = results[0] // TODO
        const promptf = mkfn(".prompt.json")
        const outputjson = mkfn(".output.json")
        const outputyaml = mkfn(".output.yaml")
        if (result.messages)
            await writeText(promptf, JSON.stringify(result.messages, null, 2))
        if (result.json) {
            await writeText(outputjson, JSON.stringify(result.json, null, 2))
            await writeText(outputyaml, YAMLStringify(result.json))
        }
    } else {
        logVerbose("")
        if (options.json && results !== undefined)
            console.log(JSON.stringify(results, null, 2))
        if (options.yaml && results !== undefined)
            console.log(YAMLStringify(results))
    }

    let _ghInfo: GithubConnectionInfo = undefined
    const resolveGitHubInfo = async () => {
        if (!_ghInfo)
            _ghInfo = await githubParseEnv(process.env, { issue: pullRequest })
        return _ghInfo
    }
    let adoInfo: AzureDevOpsEnv = undefined

    if (pullRequestReviews && annotations.length) {
        // github action or repo
        const ghInfo = await resolveGitHubInfo()
        if (ghInfo.repository && ghInfo.issue && ghInfo.commitSha) {
            await githubCreatePullRequestReviews(script, ghInfo, annotations)
        }
    }

    if (pullRequestComment && output) {
        // github action or repo
        const ghInfo = await resolveGitHubInfo()
        if (ghInfo.repository && ghInfo.issue) {
            await githubCreateIssueComment(
                script,
                ghInfo,
                prettifyMarkdown(output),
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
                    prettifyMarkdown(output),
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

    if (pullRequestDescription && output) {
        // github action or repo
        const ghInfo = await resolveGitHubInfo()
        if (ghInfo.repository && ghInfo.issue) {
            await githubUpdatePullRequestDescription(
                script,
                ghInfo,
                prettifyMarkdown(output),
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
                    prettifyMarkdown(output),
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

    if (status === "success") logInfo(`genaiscript: ${status}`)
    else if (status === "cancelled") logWarn(`genaiscript: ${status}`)
    else logError(`genaiscript: ${status}`)
    if (status !== "success" && status !== "cancelled") {
        const result = results.find((r) => r.error)
        const msg =
            errorMessage(result?.error) ??
            result?.statusText ??
            result?.finishReason
        logError(msg)
        return RUNTIME_ERROR_CODE
    }

    if (failOnErrors && annotations?.some((a) => a.severity === "error")) {
        logError("Error annotations found")
        return ANNOTATION_ERROR_CODE
    }

    return SUCCESS_ERROR_CODE
}
