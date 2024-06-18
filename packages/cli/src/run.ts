import {
    GenerationResult,
    YAMLStringify,
    diagnosticsToCSV,
    host,
    isJSONLFilename,
    logVerbose,
    readText,
    runTemplate,
    writeText,
    normalizeInt,
    normalizeFloat,
    GENAI_JS_REGEX,
    GPSPEC_REGEX,
    FILES_NOT_FOUND_ERROR_CODE,
    appendJSONL,
    RUNTIME_ERROR_CODE,
    ANNOTATION_ERROR_CODE,
    writeFileEdits,
    logError,
    isCancelError,
    USER_CANCELLED_ERROR_CODE,
    errorMessage,
    MarkdownTrace,
    HTTPS_REGEX,
    resolveModelConnectionInfo,
    CONFIGURATION_ERROR_CODE,
    parseKeyValuePairs,
    JSONSchemaStringifyToTypeScript,
    filePathOrUrlToWorkspaceFile,
    JSONSchemaStringify,
    CSV_REGEX,
    CLI_RUN_FILES_FOLDER,
    parseGHTokenFromEnv,
    githubUpdatePullRequestDescription,
    githubCreatePullRequestReviews,
    githubCreateIssueComment,
} from "genaiscript-core"
import { capitalize } from "inflection"
import { basename, resolve, join, relative } from "node:path"
import { isQuiet } from "./log"
import { emptyDir, ensureDir } from "fs-extra"
import { convertDiagnosticsToSARIF } from "./sarif"
import { buildProject } from "./build"
import { createProgressSpinner } from "./spinner"

export async function runScript(
    tool: string,
    specs: string[],
    options: {
        excludedFiles: string[]
        excludeGitIgnore: boolean
        out: string
        retry: string
        retryDelay: string
        maxDelay: string
        json: boolean
        yaml: boolean
        prompt: boolean
        outTrace: string
        outAnnotations: string
        outChangelogs: string
        pullRequestComment: string | boolean
        pullRequestDescription: string | boolean
        pullRequestReviews: boolean
        outData: string
        label: string
        temperature: string
        topP: string
        seed: string
        maxTokens: string
        maxToolCalls: string
        model: string
        csvSeparator: string
        cache: boolean
        cacheName: string
        applyEdits: boolean
        failOnErrors: boolean
        removeOut: boolean
        vars: string[]
    }
) {
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
    const cache = !!options.cache
    const applyEdits = !!options.applyEdits
    const csvSeparator = options.csvSeparator || "\t"
    const removeOut = options.removeOut
    const cacheName = options.cacheName

    const spinner =
        !stream && !isQuiet
            ? createProgressSpinner(`preparing tools in ${process.cwd()}`)
            : undefined
    const fail = (msg: string, exitCode: number) => {
        if (spinner) spinner.fail(msg)
        else logVerbose(msg)
        process.exit(exitCode)
    }

    let spec: string
    let specContent: string
    const toolFiles: string[] = []

    let md: string
    const files = new Set<string>()

    if (GENAI_JS_REGEX.test(tool)) toolFiles.push(tool)

    if (!specs?.length) {
        specContent = "\n"
        spec = "stdin.gpspec.md"
    } else if (specs.length === 1 && GPSPEC_REGEX.test(specs[0])) {
        spec = specs[0]
    } else {
        for (const arg of specs) {
            if (HTTPS_REGEX.test(arg)) files.add(arg)
            else {
                const ffs = await host.findFiles(arg, {
                    applyGitIgnore: excludeGitIgnore,
                })
                if (!ffs.length)
                    fail(`no files matching ${arg}`, FILES_NOT_FOUND_ERROR_CODE)

                for (const file of ffs) {
                    if (GPSPEC_REGEX.test(file)) {
                        md = (md || "") + (await readText(file)) + "\n"
                    } else {
                        files.add(file)
                    }
                }
            }
        }
    }

    if (excludedFiles?.length) {
        for (const arg of excludedFiles) {
            const ffs = await host.findFiles(arg)
            for (const f of ffs) files.delete(f)
        }
    }

    if (md || files.size) {
        spec = "cli.gpspec.md"
        specContent = `${md || "# Specification"}

${Array.from(files)
    .map((f) => `-   [${basename(f)}](${filePathOrUrlToWorkspaceFile(f)})`)
    .join("\n")}
`
    }

    if (!spec) fail(`genai spec not found`, FILES_NOT_FOUND_ERROR_CODE)

    if (specContent !== undefined) host.setVirtualFile(spec, specContent)

    const prj = await buildProject({
        toolFiles,
        specFiles: [spec],
    })
    const script = prj.templates.find(
        (t) =>
            t.id === tool ||
            (t.filename &&
                GENAI_JS_REGEX.test(tool) &&
                resolve(t.filename) === resolve(tool))
    )
    if (!script) throw new Error(`tool ${tool} not found`)
    const gpspec = prj.rootFiles.find(
        (f) => resolve(f.filename) === resolve(spec)
    )
    if (!gpspec) throw new Error(`spec ${spec} not found`)
    const fragment = gpspec.fragments[0]
    if (!fragment) fail(`genai spec not found`, FILES_NOT_FOUND_ERROR_CODE)

    const vars = parseKeyValuePairs(options.vars)
    let tokens = 0
    let res: GenerationResult
    try {
        const trace = new MarkdownTrace()
        trace.heading(2, options.label || script.id)
        const { info } = await resolveModelConnectionInfo(script, {
            trace,
            model: options.model,
        })
        if (info.error) {
            trace.error(undefined, info.error)
            logError(info.error)
            process.exit(CONFIGURATION_ERROR_CODE)
        }
        res = await runTemplate(prj, script, fragment, {
            infoCb: ({ text }) => {
                if (text) {
                    if (spinner) spinner.start(text)
                    else if (!isQuiet) logVerbose(text)
                }
            },
            partialCb: ({ responseChunk, tokensSoFar }) => {
                tokens = tokensSoFar
                if (stream && responseChunk) process.stdout.write(responseChunk)
                if (spinner) spinner.report({ count: tokens })
            },
            skipLLM,
            label,
            cache,
            cacheName,
            temperature,
            topP,
            seed,
            maxTokens,
            maxToolCalls,
            model: info.model,
            retry,
            retryDelay,
            maxDelay,
            vars,
            trace,
            stats: {
                toolCalls: 0,
                repairs: 0,
                turns: 0,
            },
        })
    } catch (err) {
        if (spinner) spinner.fail()
        if (isCancelError(err)) process.exit(USER_CANCELLED_ERROR_CODE)
        logError(err)
        process.exit(RUNTIME_ERROR_CODE)
    }

    if (spinner) {
        if (res.status !== "success")
            spinner.fail(`${spinner.text}, ${res.statusText}`)
        else spinner.succeed()
    } else if (res.status !== "success")
        logVerbose(res.statusText ?? res.status)

    if (outTrace && res.trace) await writeText(outTrace, res.trace)
    if (outAnnotations && res.annotations?.length) {
        if (isJSONLFilename(outAnnotations))
            await appendJSONL(outAnnotations, res.annotations)
        else
            await writeText(
                outAnnotations,
                CSV_REGEX.test(outAnnotations)
                    ? diagnosticsToCSV(res.annotations, csvSeparator)
                    : /\.ya?ml$/i.test(outAnnotations)
                      ? YAMLStringify(res.annotations)
                      : /\.sarif$/i.test(outAnnotations)
                        ? convertDiagnosticsToSARIF(script, res.annotations)
                        : JSON.stringify(res.annotations, null, 2)
            )
    }
    if (outChangelogs && res.changelogs?.length)
        await writeText(outChangelogs, res.changelogs.join("\n"))
    if (outData && res.frames?.length)
        if (isJSONLFilename(outData)) await appendJSONL(outData, res.frames)
        else await writeText(outData, JSON.stringify(res.frames, null, 2))

    if (
        applyEdits &&
        res.status === "success" &&
        Object.keys(res.fileEdits || {}).length
    )
        await writeFileEdits(res)

    const promptjson = res.messages?.length
        ? JSON.stringify(res.messages, null, 2)
        : undefined
    if (out) {
        if (removeOut) await emptyDir(out)
        await ensureDir(out)
        const jsonf = join(out, `res.json`)
        const yamlf = join(out, `res.yaml`)

        const mkfn = (ext: string) => jsonf.replace(/\.json$/i, ext)
        const promptf = mkfn(".prompt.json")
        const outputf = mkfn(".output.md")
        const outputjson = mkfn(".output.json")
        const outputyaml = mkfn(".output.yaml")
        const tracef = mkfn(".trace.md")
        const annotationf = res.annotations?.length
            ? mkfn(".annotations.csv")
            : undefined
        const sariff = res.annotations?.length ? mkfn(".sarif") : undefined
        const specf = specContent ? mkfn(".gpspec.md") : undefined
        const changelogf = res.changelogs?.length
            ? mkfn(".changelog.txt")
            : undefined
        await writeText(jsonf, JSON.stringify(res, null, 2))
        await writeText(yamlf, YAMLStringify(res))
        if (promptjson) await writeText(promptf, promptjson)
        if (res.json) {
            await writeText(outputjson, JSON.stringify(res.json, null, 2))
            await writeText(outputyaml, YAMLStringify(res.json))
        }
        if (res.text) await writeText(outputf, res.text)
        if (res.trace) await writeText(tracef, res.trace)
        if (specf) {
            const spect = await readText(spec)
            await writeText(specf, spect)
        }
        if (res.schemas) {
            for (const [sname, schema] of Object.entries(res.schemas)) {
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
                    res.annotations
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
                convertDiagnosticsToSARIF(script, res.annotations)
            )
        if (changelogf && res.changelogs?.length)
            await writeText(changelogf, res.changelogs.join("\n"))
        for (const [filename, edits] of Object.entries(res.fileEdits || {})) {
            const rel = relative(process.cwd(), filename)
            const isAbsolutePath = resolve(rel) === rel
            if (!isAbsolutePath)
                await writeText(
                    join(out, CLI_RUN_FILES_FOLDER, rel),
                    edits.after
                )
        }
    } else {
        if (options.json) console.log(JSON.stringify(res, null, 2))
        if (options.yaml) console.log(YAMLStringify(res))
        if (options.prompt && promptjson) {
            console.log(promptjson)
        }
    }

    if (pullRequestReviews && res.annotations?.length) {
        const info = parseGHTokenFromEnv(process.env)
        if (info.repository && info.issue) {
            await githubCreatePullRequestReviews(script, info, res.annotations)
        }
    }

    if (pullRequestComment && res.text) {
        const info = parseGHTokenFromEnv(process.env)
        if (info.repository && info.issue) {
            await githubCreateIssueComment(
                script,
                info,
                res.text,
                typeof pullRequestComment === "string"
                    ? pullRequestComment
                    : script.id
            )
        }
    }

    if (pullRequestDescription && res.text) {
        const info = parseGHTokenFromEnv(process.env)
        if (info.repository && info.issue) {
            await githubUpdatePullRequestDescription(
                script,
                info,
                res.text,
                typeof pullRequestDescription === "string"
                    ? pullRequestDescription
                    : script.id
            )
        }
    }
    // final fail
    if (res.error) {
        logVerbose(errorMessage(res.error))
        process.exit(RUNTIME_ERROR_CODE)
    }

    if (failOnErrors && res.annotations?.some((a) => a.severity === "error")) {
        logVerbose(`error annotations found, exiting with error code`)
        process.exit(ANNOTATION_ERROR_CODE)
    }

    spinner?.stop()
    process.stderr.write("\n")
}
