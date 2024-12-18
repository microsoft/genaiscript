import {
    CONVERTS_DIR_NAME,
    FILES_NOT_FOUND_ERROR_CODE,
    GENAI_ANY_REGEX,
    GENAI_ANYTS_REGEX,
    GENAI_MD_EXT,
    HTTPS_REGEX,
    JSON5_REGEX,
} from "../../core/src/constants"
import { filePathOrUrlToWorkspaceFile, tryReadText } from "../../core/src/fs"
import { host } from "../../core/src/host"
import { MarkdownTrace, TraceOptions } from "../../core/src/trace"
import {
    dotGenaiscriptPath,
    logError,
    logInfo,
    logVerbose,
    normalizeInt,
} from "../../core/src/util"
import { buildProject } from "./build"
import { run } from "./api"
import { writeText } from "../../core/src/fs"
import { PromptScriptRunOptions } from "./main"
import { PLimitPromiseQueue } from "../../core/src/concurrency"
import { createPatch } from "diff"
import { unfence } from "../../core/src/fence"
import { JSONLLMTryParse, JSONTryParse } from "../../core/src/json5"
import { applyModelOptions } from "./modealias"
import { ensureDotGenaiscriptPath, setupTraceWriting } from "./trace"
import { tracePromptResult } from "../../core/src/chat"

export async function convertFiles(
    scriptId: string,
    fileGlobs: string[],
    options: Partial<PromptScriptRunOptions> & {
        suffix?: string
        rewrite?: boolean
        cancelWord?: string
        concurrency?: string
    }
): Promise<void> {
    const {
        excludedFiles,
        excludeGitIgnore,
        rewrite,
        cancelWord,
        concurrency,
        ...restOptions
    } = options || {}

    await ensureDotGenaiscriptPath()
    applyModelOptions(options)
    const outTrace = dotGenaiscriptPath(
        CONVERTS_DIR_NAME,
        host.path.basename(scriptId).replace(GENAI_ANYTS_REGEX, ""),
        `${new Date().toISOString().replace(/[:.]/g, "-")}.trace.md`
    )
    const trace = new MarkdownTrace()
    const outTraceFilename = await setupTraceWriting(trace, outTrace)

    const fail = (msg: string, exitCode: number, url?: string) => {
        throw new Error(msg)
    }
    const { resolve } = host.path

    const toolFiles: string[] = []
    if (GENAI_ANY_REGEX.test(scriptId)) toolFiles.push(scriptId)
    const prj = await buildProject({
        toolFiles,
    })
    const script = prj.scripts.find(
        (t) =>
            t.id === scriptId ||
            (t.filename &&
                GENAI_ANY_REGEX.test(scriptId) &&
                resolve(t.filename) === resolve(scriptId))
    )
    if (!script) {
        trace.error(`script ${scriptId} not found`)
        throw new Error(`script ${scriptId} not found`)
    }

    const suffix = options?.suffix || `.genai.${script.id}.md`
    trace.heading(2, `convert with ${script.id}`)
    trace.itemValue(`suffix`, suffix)

    // resolve files
    const resolvedFiles = new Set<string>()
    for (let arg of fileGlobs) {
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
            if (!rewrite && file.toLocaleLowerCase().endsWith(suffix)) continue
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

    // processing
    const files = Array.from(resolvedFiles).map(
        (filename) => ({ filename }) as WorkspaceFile
    )

    const results: Record<string, string> = {}
    const p = new PLimitPromiseQueue(normalizeInt(concurrency) || 1)
    await p.mapAll(files, async (file) => {
        const outf = rewrite ? file.filename : file.filename + suffix
        logInfo(`${file.filename} -> ${outf}`)
        const fileTrace = trace.startTraceDetails(file.filename)
        try {
            // apply AI transformation
            const result = await run(script.filename, file.filename, {
                label: file.filename,
                ...restOptions,
            })
            tracePromptResult(fileTrace, result)
            const { error } = result || {}
            if (error) {
                logError(error)
                fileTrace.error(undefined, error)
                return
            }
            if (result.status === "cancelled") {
                logVerbose(`cancelled ${file.filename}`)
                fileTrace.item(`cancelled`)
                return
            }
            // LLM canceled
            if (cancelWord && result?.text?.includes(cancelWord)) {
                logVerbose(`cancel word detected, skipping ${file.filename}`)
                fileTrace.itemValue(`cancel word detected`, cancelWord)
                return
            }
            logVerbose(Object.keys(result.fileEdits || {}).join("\n"))
            // structured extraction
            const fileEdit = Object.entries(result.fileEdits || {}).find(
                ([fn]) => resolve(fn) === resolve(file.filename)
            )?.[1]
            //            if (!fileEdit) {
            //              console.log({
            //                filename: file.filename,
            //              edits: result.fileEdits,
            //        })
            const suffixext = suffix.replace(/^.genai./i, ".")
            const fence = result.fences.find((f) => f.language === suffixext)
            let text: string = undefined
            if (fileEdit?.after) {
                if (fileEdit.validation?.schemaError) {
                    logError("schema validation error")
                    logVerbose(fileEdit.validation.schemaError)
                    fileTrace.error(undefined, fileEdit.validation.schemaError)
                    return
                }
                text = fileEdit.after
            }
            if (text === undefined && fence) {
                if (fence.validation?.schemaError) {
                    logError("schema validation error")
                    logVerbose(fence.validation.schemaError)
                    fileTrace.error(undefined, fence.validation.schemaError)
                    return
                }
                text = fence.content
            }
            if (text === undefined) text = unfence(result.text, "markdown")

            // normalize JSON
            if (JSON5_REGEX.test(outf) && text) {
                // normalize data
                let data = JSONTryParse(text)
                if (data === undefined) {
                    data = JSONLLMTryParse(text)
                    if (data !== undefined) {
                        logVerbose("repair json")
                        text = JSON.stringify(text, null, 2)
                    }
                }
            }

            // save file
            const existing = await tryReadText(outf)
            if (text && existing !== text) {
                if (rewrite) {
                    const patch = createPatch(
                        outf,
                        existing || "",
                        text || "",
                        undefined,
                        undefined,
                        {}
                    )
                    logVerbose(patch)
                }
                await writeText(outf, text)
            }

            results[file.filename] = text
        } catch (error) {
            logError(error)
            fileTrace.error(undefined, error)
        } finally {
            logVerbose("")
            fileTrace.endDetails()
        }
    })

    logVerbose(`trace: ${outTraceFilename}`)
}
