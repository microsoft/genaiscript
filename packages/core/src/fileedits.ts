import { applyChangeLog, parseChangeLogs } from "./changelog"
import { applyLLMDiff, applyLLMPatch, parseLLMDiffs } from "./diff"
import { errorMessage } from "./error"
import { unquote } from "./fence"
import { fileExists, readText } from "./fs"
import { isGlobMatch } from "./glob"
import { runtimeHost } from "./host"
import { JSON5parse } from "./json5"
import { stringToPos } from "./parser"
import { validateJSONWithSchema } from "./schema"
import { MarkdownTrace, TraceOptions } from "./trace"
import { logError, logVerbose, relativePath } from "./util"
import { YAMLParse } from "./yaml"

export async function computeFileEdits(
    res: RunPromptResult,
    options: TraceOptions & {
        fileOutputs: FileOutput[]
        schemas?: Record<string, JSONSchema>
        fileMerges?: FileMergeHandler[]
        outputProcessors?: PromptOutputProcessorHandler[]
    }
): Promise<{
    edits: Edits[]
    fileEdits: Record<string, FileUpdate>
    changelogs: string[]
}> {
    const { trace, fileOutputs, fileMerges, outputProcessors, schemas } =
        options || {}
    const { fences, frames, genVars } = res
    let text = res.text
    let annotations = res.annotations?.slice(0)
    const fileEdits: Record<string, FileUpdate> = {}
    const changelogs: string[] = []
    const edits: Edits[] = []
    const projFolder = runtimeHost.projectFolder()

    // Helper function to get or create file edit object
    const getFileEdit = async (fn: string) => {
        fn = relativePath(projFolder, fn)
        let fileEdit = fileEdits[fn]
        if (!fileEdit) {
            let before: string = null
            let after: string = undefined
            if (await fileExists(fn)) before = await readText(fn)
            else if (await fileExists(fn)) after = await readText(fn)
            fileEdit = fileEdits[fn] = <FileUpdate>{ before, after }
        }
        return fileEdit
    }

    for (const fence of fences.filter(
        ({ validation }) => validation?.valid !== false
    )) {
        const { label: name, content: val, language } = fence
        const pm = /^((file|diff):?)\s+/i.exec(name)
        if (pm) {
            const kw = pm[1].toLowerCase()
            const n = unquote(name.slice(pm[0].length).trim())
            const fn = /^[^\/]/.test(n)
                ? runtimeHost.resolvePath(projFolder, n)
                : n
            const fileEdit = await getFileEdit(fn)
            if (kw === "file") {
                if (fileMerges.length) {
                    try {
                        for (const fileMerge of fileMerges)
                            fileEdit.after =
                                (await fileMerge(
                                    fn,
                                    "", // todo
                                    fileEdit.after ?? fileEdit.before,
                                    val
                                )) ?? val
                    } catch (e) {
                        logVerbose(e)
                        trace.error(`error custom merging diff in ${fn}`, e)
                    }
                } else fileEdit.after = val
            } else if (kw === "diff") {
                const chunks = parseLLMDiffs(val)
                try {
                    fileEdit.after = applyLLMPatch(
                        fileEdit.after || fileEdit.before,
                        chunks
                    )
                } catch (e) {
                    logVerbose(e)
                    trace.error(`error applying patch to ${fn}`, e)
                    try {
                        fileEdit.after = applyLLMDiff(
                            fileEdit.after || fileEdit.before,
                            chunks
                        )
                    } catch (e) {
                        logVerbose(e)
                        trace.error(`error merging diff in ${fn}`, e)
                    }
                }
            }
        } else if (/^changelog$/i.test(name) || /^changelog/i.test(language)) {
            changelogs.push(val)
            const cls = parseChangeLogs(val)
            for (const changelog of cls) {
                const { filename } = changelog
                const fn = /^[^\/]/.test(filename) // TODO
                    ? runtimeHost.resolvePath(projFolder, filename)
                    : filename
                const fileEdit = await getFileEdit(fn)
                fileEdit.after = applyChangeLog(
                    fileEdit.after || fileEdit.before || "",
                    changelog
                )
            }
        }
    }

    // Apply user-defined output processors
    if (outputProcessors?.length) {
        try {
            trace.startDetails("🖨️ output processors")
            for (const outputProcessor of outputProcessors) {
                const {
                    text: newText,
                    files,
                    annotations: oannotations,
                } = (await outputProcessor({
                    text,
                    fileEdits,
                    fences,
                    frames,
                    genVars,
                    annotations,
                    schemas,
                })) || {}

                if (newText !== undefined) {
                    text = newText
                    trace.detailsFenced(`📝 text`, text)
                }

                if (files)
                    for (const [n, content] of Object.entries(files)) {
                        const fn = runtimeHost.path.isAbsolute(n)
                            ? n
                            : runtimeHost.resolvePath(projFolder, n)
                        trace.detailsFenced(`📁 file ${fn}`, content)
                        const fileEdit = await getFileEdit(fn)
                        fileEdit.after = content
                        fileEdit.validation = { valid: true }
                    }
                if (oannotations) annotations = oannotations.slice(0)
            }
        } catch (e) {
            logError(e)
            trace.error(`output processor failed`, e)
        } finally {
            trace.endDetails()
        }
    }

    // Validate and apply file outputs
    validateFileOutputs(fileOutputs, trace, fileEdits, schemas)

    // Convert file edits into structured edits
    Object.entries(fileEdits)
        .filter(([, { before, after }]) => before !== after) // ignore unchanged files
        .forEach(([fn, { before, after, validation }]) => {
            if (before) {
                edits.push(<ReplaceEdit>{
                    label: `Update ${fn}`,
                    filename: fn,
                    type: "replace",
                    range: [[0, 0], stringToPos(after)],
                    text: after,
                    validated: validation?.valid,
                })
            } else {
                edits.push({
                    label: `Create ${fn}`,
                    filename: fn,
                    type: "createfile",
                    text: after,
                    overwrite: true,
                    validated: validation?.valid,
                })
            }
        })

    return { fileEdits, changelogs, edits }
}

// Validate file outputs against specified schemas and patterns
/**
 * Validates file outputs based on provided patterns and schemas.
 * @param fileOutputs List of file outputs to validate.
 * @param trace The markdown trace for logging.
 * @param fileEdits Record of file updates.
 * @param schemas The JSON schemas for validation.
 */
function validateFileOutputs(
    fileOutputs: FileOutput[],
    trace: MarkdownTrace,
    fileEdits: Record<string, FileUpdate>,
    schemas: Record<string, JSONSchema>
) {
    if (fileOutputs?.length && Object.keys(fileEdits || {}).length) {
        trace.startDetails("🗂 file outputs")
        for (const fileEditName of Object.keys(fileEdits)) {
            const fe = fileEdits[fileEditName]
            for (const fileOutput of fileOutputs) {
                const { pattern, options } = fileOutput
                if (isGlobMatch(fileEditName, pattern)) {
                    try {
                        trace.startDetails(`📁 ${fileEditName}`)
                        trace.itemValue(`pattern`, pattern)
                        const { schema: schemaId } = options || {}
                        if (/\.(json|yaml)$/i.test(fileEditName)) {
                            const { after } = fileEdits[fileEditName]
                            const data = /\.json$/i.test(fileEditName)
                                ? JSON5parse(after)
                                : YAMLParse(after)
                            trace.detailsFenced("📝 data", data)
                            if (schemaId) {
                                const schema = schemas[schemaId]
                                if (!schema)
                                    fe.validation = {
                                        valid: false,
                                        error: `schema ${schemaId} not found`,
                                    }
                                else
                                    fe.validation = validateJSONWithSchema(
                                        data,
                                        schema,
                                        {
                                            trace,
                                        }
                                    )
                            }
                        } else {
                            fe.validation = { valid: true }
                        }
                    } catch (e) {
                        trace.error(errorMessage(e))
                        fe.validation = {
                            valid: false,
                            error: errorMessage(e),
                        }
                    } finally {
                        trace.endDetails()
                    }
                    break
                }
            }
        }
        trace.endDetails()
    }
}
