import { capitalize } from "inflection"
import { resolve, join, relative, dirname } from "node:path"
import { isQuiet } from "./log"
import { emptyDir, ensureDir } from "fs-extra"
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
} from "../../core/src/constants"
import { isCancelError, errorMessage } from "../../core/src/error"
import { Fragment, GenerationResult } from "../../core/src/generation"
import { parseKeyValuePairs } from "../../core/src/fence"
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
    delay,
} from "../../core/src/util"
import { YAMLStringify } from "../../core/src/yaml"
import { PromptScriptRunOptions } from "../../core/src/server/messages"
import { writeFileEdits } from "../../core/src/edits"
import {
    azureDevOpsCreateIssueComment,
    azureDevOpsParseEnv,
    azureDevOpsUpdatePullRequestDescription,
} from "../../core/src/azuredevops"
import { resolveTokenEncoder } from "../../core/src/encoders"
import { appendFile, writeFile } from "fs/promises"

async function setupTraceWriting(trace: MarkdownTrace, filename: string) {
    await ensureDir(dirname(filename))
    await writeFile(filename, "", { encoding: "utf-8" })
    trace.addEventListener(
        TRACE_CHUNK,
        async (ev) => {
            const tev = ev as TraceChunkEvent
            await appendFile(filename, tev.chunk, { encoding: "utf-8" })
        },
        false
    )
}

export async function runScriptWithExitCode(
    scriptId: string,
    files: string[],
    options: Partial<PromptScriptRunOptions> &
        TraceOptions &
        CancellationOptions
) {
    const runRetry = Math.max(1, normalizeInt(options.runRetry) || 1)
    let exitCode = -1
    for (let r = 0; r < runRetry; ++r) {
        const res = await runScript(scriptId, files, options)
        exitCode = res.exitCode
        if (UNRECOVERABLE_ERROR_CODES.includes(exitCode)) break

        const delayMs = 2000 * Math.pow(2, r)
        console.error(`run failed, retry #${r + 1}/${runRetry} in ${delayMs}ms`)
        await delay(delayMs)
    }
    process.exit(exitCode)
}

export async function runScript(
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
    const skipLLM = !!options.prompt
    const retry = parseInt(options.retry) || 8
    const retryDelay = parseInt(options.retryDelay) || 15000
    const maxDelay = parseInt(options.maxDelay) || 180000
    const outTrace = options.outTrace
    const outAnnotations = options.outAnnotations
    const failOnErrors = options.failOnErrors
    const outChangelogs = options.outChangelogs
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

    const fail = (msg: string, exitCode: number) => {
        logVerbose(msg)
        return { exitCode, result }
    }

    if (out) {
        if (removeOut) await emptyDir(out)
        await ensureDir(out)
    }
    if (outTrace && trace) await setupTraceWriting(trace, outTrace)
    if (out && trace) {
        const ofn = join(out, "res.trace.md")
        if (ofn !== outTrace) {
            await setupTraceWriting(trace, ofn)
        }
    }

    const toolFiles: string[] = []
    const resolvedFiles = new Set<string>()

    if (GENAI_ANY_REGEX.test(scriptId)) toolFiles.push(scriptId)

    for (const arg of files) {
        if (HTTPS_REGEX.test(arg)) resolvedFiles.add(arg)
        else {
            const ffs = await host.findFiles(arg, {
                applyGitIgnore: excludeGitIgnore,
            })
            if (!ffs?.length) {
                return fail(
                    `no files matching ${arg}`,
                    FILES_NOT_FOUND_ERROR_CODE
                )
            }
            for (const file of ffs) {
                resolvedFiles.add(filePathOrUrlToWorkspaceFile(file))
            }
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
        prj.templates.push({
            id: scriptId,
            jsSource,
        })
    const script = prj.templates.find(
        (t) =>
            t.id === scriptId ||
            (t.filename &&
                GENAI_ANY_REGEX.test(scriptId) &&
                resolve(t.filename) === resolve(scriptId))
    )
    if (!script) throw new Error(`tool ${scriptId} not found`)
    const fragment: Fragment = {
        files: Array.from(resolvedFiles),
    }
    const vars = parseKeyValuePairs(options.vars)
    let tokens = 0
    try {
        if (options.label) trace.heading(2, options.label)
        const { info } = await resolveModelConnectionInfo(script, {
            trace,
            model: options.model,
        })
        if (info.error) {
            trace.error(undefined, info.error)
            logError(info.error)
            return fail("invalid model configuration", CONFIGURATION_ERROR_CODE)
        }
        trace.options.encoder = await resolveTokenEncoder(info.model)
        await runtimeHost.models.pullModel(info.model)
        result = await runTemplate(prj, script, fragment, {
            infoCb: (args) => {
                const { text } = args
                if (text) {
                    if (!isQuiet) logVerbose(text)
                    infoCb?.(args)
                }
            },
            partialCb: (args) => {
                const { responseChunk, tokensSoFar } = args
                tokens = tokensSoFar
                if (responseChunk !== undefined) {
                    if (stream) process.stdout.write(responseChunk)
                    else if (!isQuiet) process.stderr.write(responseChunk)
                }
                partialCb?.(args)
            },
            skipLLM,
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
                host.defaultEmbeddingsModelOptions.embeddingsModel,
            retry,
            retryDelay,
            maxDelay,
            vars,
            trace,
            cliInfo: {
                files,
            },
            stats: {
                toolCalls: 0,
                repairs: 0,
                turns: 0,
            },
        })
    } catch (err) {
        if (isCancelError(err))
            return fail("user cancelled", USER_CANCELLED_ERROR_CODE)
        logError(err)
        return fail("runtime error", RUNTIME_ERROR_CODE)
    }
    if (!isQuiet) logVerbose("") // force new line
    if (result.status !== "success")
        logVerbose(result.statusText ?? result.status)

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

    if (result.status === "success" && result.fileEdits)
        await writeFileEdits(result, applyEdits)

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
    } else {
        logVerbose("")
        if (options.json && result !== undefined)
            console.log(JSON.stringify(result, null, 2))
        if (options.yaml && result !== undefined)
            console.log(YAMLStringify(result))
        if (options.prompt && promptjson) {
            console.log(promptjson)
        }
    }

    if (pullRequestReviews && result.annotations?.length) {
        const info = githubParseEnv(process.env)
        if (info.repository && info.issue) {
            await githubCreatePullRequestReviews(
                script,
                info,
                result.annotations
            )
        }
    }

    if (pullRequestComment && result.text) {
        const info = githubParseEnv(process.env)
        if (info.repository && info.issue) {
            await githubCreateIssueComment(
                script,
                info,
                result.text,
                typeof pullRequestComment === "string"
                    ? pullRequestComment
                    : script.id
            )
        } else {
            const adoinfo = azureDevOpsParseEnv(process.env)
            if (adoinfo?.collectionUri) {
                await azureDevOpsCreateIssueComment(
                    script,
                    adoinfo,
                    result.text,
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
        // github
        const ghinfo = githubParseEnv(process.env)
        if (ghinfo?.repository && ghinfo?.issue) {
            await githubUpdatePullRequestDescription(
                script,
                ghinfo,
                result.text,
                typeof pullRequestDescription === "string"
                    ? pullRequestDescription
                    : script.id
            )
        } else {
            // azure devops
            const adoinfo = azureDevOpsParseEnv(process.env)
            if (adoinfo?.collectionUri) {
                await azureDevOpsUpdatePullRequestDescription(
                    script,
                    adoinfo,
                    result.text,
                    typeof pullRequestDescription === "string"
                        ? pullRequestDescription
                        : script.id
                )
            } else {
                logError(
                    "pull request review: no pull request information found"
                )
            }
        }
    }
    // final fail
    if (result.error)
        return fail(errorMessage(result.error), RUNTIME_ERROR_CODE)

    if (failOnErrors && result.annotations?.some((a) => a.severity === "error"))
        return fail("error annotations found", ANNOTATION_ERROR_CODE)

    process.stderr.write("\n")
    return { exitCode: 0, result }
}
