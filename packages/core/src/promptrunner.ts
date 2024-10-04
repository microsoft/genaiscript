// Import necessary modules and functions for handling chat sessions, templates, file management, etc.
import { executeChatSession, tracePromptResult } from "./chat"
import { Project, PromptScript } from "./ast"
import { stringToPos } from "./parser"
import { arrayify, assert, logError, logVerbose, relativePath } from "./util"
import { runtimeHost } from "./host"
import { applyLLMDiff, applyLLMPatch, parseLLMDiffs } from "./diff"
import { MarkdownTrace } from "./trace"
import { applyChangeLog, parseChangeLogs } from "./changelog"
import { CORE_VERSION } from "./version"
import { expandFiles, fileExists, readText } from "./fs"
import { CSVToMarkdown } from "./csv"
import { Fragment, GenerationOptions } from "./generation"
import { traceCliArgs } from "./clihelp"
import { GenerationResult } from "./generation"
import { resolveModelConnectionInfo } from "./models"
import { RequestError, errorMessage } from "./error"
import { renderFencedVariables, unquote } from "./fence"
import { parsePromptParameters } from "./parameters"
import { resolveFileContent } from "./file"
import { isGlobMatch } from "./glob"
import { validateJSONWithSchema } from "./schema"
import { YAMLParse } from "./yaml"
import { expandTemplate } from "./expander"
import { resolveLanguageModel } from "./lm"
import { Stats } from "fs"

// Asynchronously resolve expansion variables needed for a template
/**
 * Resolves variables required for the expansion of a template.
 * @param project The project context.
 * @param trace The markdown trace for logging.
 * @param template The prompt script template.
 * @param frag The fragment containing files and metadata.
 * @param vars The user-provided variables.
 * @returns An object containing resolved variables.
 */
async function resolveExpansionVars(
    project: Project,
    trace: MarkdownTrace,
    template: PromptScript,
    frag: Fragment,
    vars: Record<string, string | number | boolean | object>
) {
    const root = runtimeHost.projectFolder()

    const files: WorkspaceFile[] = []
    const fr = frag
    const templateFiles = arrayify(template.files)
    const referenceFiles = fr.files.slice(0)
    const filenames = await expandFiles(
        referenceFiles?.length ? referenceFiles : templateFiles
    )
    for (let filename of filenames) {
        filename = relativePath(root, filename)

        // Skip if file already in the list
        if (files.find((lk) => lk.filename === filename)) continue
        const file: WorkspaceFile = { filename }
        await resolveFileContent(file)
        files.push(file)
    }

    // Parse and obtain attributes from prompt parameters
    const attrs = parsePromptParameters(project, template, vars)
    const secrets: Record<string, string> = {}

    // Read secrets defined in the template
    for (const secret of template.secrets || []) {
        const value = await runtimeHost.readSecret(secret)
        if (value) {
            trace.item(`secret \`${secret}\` used`)
            secrets[secret] = value
        } else trace.error(`secret \`${secret}\` not found`)
    }

    // Create and return an object containing resolved variables
    const res: Partial<ExpansionVariables> = {
        dir: ".",
        files,
        template: {
            id: template.id,
            title: template.title,
            description: template.description,
        },
        vars: attrs,
        secrets,
    }
    return res
}

// Main function to run a template with given options
/**
 * Executes a prompt template with specified options.
 * @param prj The project context.
 * @param template The prompt script template.
 * @param fragment The fragment containing additional context.
 * @param options Options for generation, including model and trace.
 * @returns A generation result with details of the execution.
 */
export async function runTemplate(
    prj: Project,
    template: PromptScript,
    fragment: Fragment,
    options: GenerationOptions
): Promise<GenerationResult> {
    assert(fragment !== undefined)
    assert(options !== undefined)
    assert(options.trace !== undefined)
    const { skipLLM, label, cliInfo, trace, cancellationToken, model } = options
    const version = CORE_VERSION
    assert(model !== undefined)

    runtimeHost.project = prj

    try {
        trace.heading(3, `🧠 running ${template.id} with model ${model ?? ""}`)
        if (cliInfo) traceCliArgs(trace, template, options)

        // Resolve expansion variables for the template
        const vars = await resolveExpansionVars(
            prj,
            trace,
            template,
            fragment,
            options.vars
        )
        let {
            messages,
            schemas,
            functions,
            fileMerges,
            outputProcessors,
            chatParticipants,
            fileOutputs,
            status,
            statusText,
            temperature,
            topP,
            maxTokens,
            seed,
            responseType,
            responseSchema,
        } = await expandTemplate(
            prj,
            template,
            options,
            vars as ExpansionVariables,
            trace
        )

        // Handle failed expansion scenario
        if (status !== "success" || !messages.length) {
            trace.renderErrors()
            return <GenerationResult>{
                status,
                statusText,
                messages,
                vars,
                text: "",
                edits: [],
                annotations: [],
                changelogs: [],
                fileEdits: {},
                label,
                version,
                fences: [],
                frames: [],
            }
        }

        // If LLM is skipped, return early
        if (skipLLM) {
            trace.renderErrors()
            return <GenerationResult>{
                status: "cancelled",
                statusText: "LLM generation skipped",
                messages,
                vars,
                text: "",
                edits: [],
                annotations: [],
                changelogs: [],
                fileEdits: {},
                label,
                version,
                fences: [],
                frames: [],
            }
        }
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

        // Resolve model connection information
        const connection = await resolveModelConnectionInfo(
            { model },
            { trace, token: true }
        )
        if (connection.info.error)
            throw new Error(errorMessage(connection.info.error))
        if (!connection.configuration)
            throw new RequestError(
                403,
                "LLM configuration missing",
                connection.info
            )
        const { completer } = await resolveLanguageModel(
            connection.configuration.provider
        )

        // Execute chat session with the resolved configuration
        const genOptions: GenerationOptions = {
            ...options,
            responseType,
            responseSchema,
            model,
            temperature,
            maxTokens,
            topP,
            seed,
            stats: options.stats.createChild(connection.info.model),
        }
        const output = await executeChatSession(
            connection.configuration,
            cancellationToken,
            messages,
            functions,
            schemas,
            completer,
            chatParticipants,
            genOptions
        )
        tracePromptResult(trace, output)

        const {
            json,
            fences,
            frames,
            genVars = {},
            error,
            finishReason,
            usages,
        } = output
        let { text, annotations } = output

        // Handle fenced code regions within the output
        if (json === undefined) {
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
                                            label,
                                            fileEdit.after ?? fileEdit.before,
                                            val
                                        )) ?? val
                            } catch (e) {
                                logVerbose(e)
                                trace.error(
                                    `error custom merging diff in ${fn}`,
                                    e
                                )
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
                } else if (
                    /^changelog$/i.test(name) ||
                    /^changelog/i.test(language)
                ) {
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

        // Reporting and tracing output
        if (fences?.length)
            trace.details("📩 code regions", renderFencedVariables(fences))
        if (edits.length)
            trace.details(
                "✏️ edits",
                CSVToMarkdown(edits, {
                    headers: ["type", "filename", "message", "validated"],
                })
            )
        if (annotations?.length)
            trace.details(
                "⚠️ annotations",
                CSVToMarkdown(
                    annotations.map((a) => ({
                        ...a,
                        line: a.range?.[0]?.[0],
                        endLine: a.range?.[1]?.[0] ?? "",
                        code: a.code ?? "",
                    })),
                    {
                        headers: [
                            "severity",
                            "filename",
                            "line",
                            "endLine",
                            "code",
                            "message",
                        ],
                    }
                )
            )

        trace.renderErrors()
        const res: GenerationResult = {
            status:
                finishReason === "cancel"
                    ? "cancelled"
                    : finishReason === "stop"
                      ? "success"
                      : "error",
            finishReason,
            error,
            messages,
            vars,
            edits,
            annotations,
            changelogs,
            fileEdits,
            text,
            version,
            fences,
            frames,
            genVars,
            schemas,
            json,
        }

        // If there's an error, provide status text
        if (res.status === "error" && !res.statusText && res.finishReason) {
            res.statusText = `LLM finish reason: ${res.finishReason}`
        }
        return res
    } finally {
        // Cleanup any resources like running containers or browsers
        await runtimeHost.removeContainers()
        await runtimeHost.removeBrowsers()
    }
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
                                ? JSON.parse(after)
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
