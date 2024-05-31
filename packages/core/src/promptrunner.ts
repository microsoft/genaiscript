import { executeChatSession } from "./chat"
import { Fragment, Project, PromptScript } from "./ast"
import { stringToPos } from "./parser"
import { arrayify, assert, logVerbose, relativePath, unique } from "./util"
import { staticVars } from "./template"
import { host } from "./host"
import { applyLLMDiff, applyLLMPatch, parseLLMDiffs } from "./diff"
import { MarkdownTrace } from "./trace"
import { applyChangeLog, parseChangeLogs } from "./changelog"
import { CORE_VERSION } from "./version"
import { expandFiles, fileExists, readText, tryReadText } from "./fs"
import { CSVToMarkdown } from "./csv"
import { GenerationOptions } from "./promptcontext"
import { traceCliArgs } from "./clihelp"
import { GenerationResult, expandTemplate } from "./expander"
import { resolveLanguageModel, resolveModelConnectionInfo } from "./models"
import { RequestError, errorMessage } from "./error"
import { createFetch } from "./fetch"
import { unquote } from "./fence"
import { HTTPS_REGEX } from "./constants"
import { parsePromptParameters } from "./parameters"
import { resolveFileContent } from "./file"

async function resolveExpansionVars(
    trace: MarkdownTrace,
    template: PromptScript,
    frag: Fragment,
    vars: Record<string, string>
) {
    const { file } = frag
    const project = file.project
    const root = host.projectFolder()

    const files: WorkspaceFile[] = []
    const fr = frag
    const templateFiles = arrayify(template.files)
    const referenceFiles = fr.references.map(({ filename }) => filename)
    const filenames = await expandFiles(
        referenceFiles?.length ? referenceFiles : templateFiles
    )
    for (let filename of filenames) {
        filename = relativePath(root, filename)

        if (files.find((lk) => lk.filename === filename)) continue
        const file: WorkspaceFile = { filename }
        await resolveFileContent(file)
        files.push(file)
    }

    const attrs = parsePromptParameters(project, template, vars)
    const secrets: Record<string, string> = {}
    for (const secret of template.secrets || []) {
        const value = await host.readSecret(secret)
        if (value) {
            trace.item(`secret \`${secret}\` used`)
            secrets[secret] = value
        } else trace.error(`secret \`${secret}\` not found`)
    }
    const res: Partial<ExpansionVariables> = {
        ...staticVars(),
        spec: {
            filename: relativePath(host.projectFolder(), file.filename),
            content: file.content,
        },
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

export async function runTemplate(
    prj: Project,
    template: PromptScript,
    fragment: Fragment,
    options: GenerationOptions
): Promise<GenerationResult> {
    assert(fragment !== undefined)
    assert(options !== undefined)
    assert(options.trace !== undefined)
    const { skipLLM, label, cliInfo, trace } = options
    const cancellationToken = options?.cancellationToken
    const version = CORE_VERSION
    const model = options.model
    assert(model !== undefined)

    try {
        if (cliInfo) traceCliArgs(trace, template, options)

        const vars = await resolveExpansionVars(
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
            status,
            statusText,
            temperature,
            topP,
            max_tokens,
            seed,
            responseType,
            responseSchema,
        } = await expandTemplate(
            prj,
            template,
            fragment,
            options,
            vars as ExpansionVariables,
            trace
        )

        // if the expansion failed, show the user the trace
        if (status !== "success") {
            trace.renderErrors()
            return <GenerationResult>{
                status,
                statusText,
                messages,
                vars,
                trace: trace.content,
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

        // don't run LLM
        if (skipLLM) {
            trace.renderErrors()
            return <GenerationResult>{
                status: "cancelled",
                messages,
                vars,
                trace: trace.content,
                text: undefined,
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
        const genOptions: GenerationOptions = {
            ...options,
            responseType,
            responseSchema,
            model,
            temperature: temperature,
            maxTokens: max_tokens,
            topP: topP,
            seed: seed,
        }
        const updateStatus = (text?: string) => {
            options.infoCb?.({
                vars,
                text,
                label,
            })
        }

        const fileEdits: Record<string, { before: string; after: string }> = {}
        const changelogs: string[] = []
        const edits: Edits[] = []
        const projFolder = host.projectFolder()
        const links: string[] = []
        const fp = fragment.file.filename
        const fragn = /^.\//.test(fp)
            ? host.resolvePath(projFolder, fragment.file.filename)
            : fp
        const ff = host.resolvePath(fp, "..")
        const refs = fragment.references
        const getFileEdit = async (fn: string) => {
            let fileEdit = fileEdits[fn]
            if (!fileEdit) {
                let before: string = null
                let after: string = undefined
                if (await fileExists(fn, { virtual: false }))
                    before = await readText(fn)
                else if (await fileExists(fn, { virtual: true }))
                    after = await readText(fn)
                fileEdit = fileEdits[fn] = { before, after }
            }
            return fileEdit
        }

        updateStatus(`prompting model ${model}`)
        const connection = await resolveModelConnectionInfo(
            { model },
            { trace, token: true }
        )
        if (connection.info.error)
            throw new Error(errorMessage(connection.info.error))
        if (!connection.token)
            throw new RequestError(
                403,
                "LLM configuration missing",
                connection.info
            )

        const { completer } = resolveLanguageModel(genOptions)
        const output = await executeChatSession(
            connection.token,
            cancellationToken,
            messages,
            functions,
            schemas,
            completer,
            genOptions
        )
        const {
            json,
            fences,
            frames,
            genVars = {},
            error,
            finishReason,
        } = output
        let { text, annotations } = output
        if (json !== undefined) {
            trace.detailsFenced("📩 json (parsed)", json, "json")
            const fn = fragment.file.filename.replace(
                /\.gpspec\.md$/i,
                "." + template.id + ".json"
            )
            const fileEdit = await getFileEdit(fn)
            fileEdit.after = text
        } else {
            if (text) trace.detailsFenced(`🔠 output`, text, `markdown`)
            for (const fence of fences.filter(
                ({ validation }) => validation?.valid !== false
            )) {
                const { label: name, content: val } = fence
                const pm = /^((file|diff):?)\s+/i.exec(name)
                if (pm) {
                    const kw = pm[1].toLowerCase()
                    const n = unquote(name.slice(pm[0].length).trim())
                    const fn = /^[^\/]/.test(n)
                        ? host.resolvePath(projFolder, n)
                        : n
                    const ffn = relativePath(ff, fn)
                    const curr = refs.find((r) => r.filename === fn)?.filename

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
                    if (!curr && fragn !== fn)
                        links.push(`-   [${ffn}](${ffn})`)
                } else if (/^changelog$/i.test(name)) {
                    changelogs.push(val)
                    const cls = parseChangeLogs(val)
                    for (const changelog of cls) {
                        const { filename } = changelog
                        const fn = /^[^\/]/.test(filename)
                            ? host.resolvePath(projFolder, filename)
                            : filename
                        const ffn = relativePath(ff, fn)
                        const curr = refs.find(
                            (r) => r.filename === fn
                        )?.filename

                        const fileEdit = await getFileEdit(fn)
                        fileEdit.after = applyChangeLog(
                            fileEdit.after || fileEdit.before || "",
                            changelog
                        )
                        if (!curr && fragn !== fn)
                            links.push(`-   [${ffn}](${ffn})`)
                    }
                }
            }
        }

        // apply user output processors
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
                            const fn = /^[^\/]/.test(n)
                                ? host.resolvePath(projFolder, n)
                                : n
                            trace.detailsFenced(`📁 file ${fn}`, content)
                            const fileEdit = await getFileEdit(fn)
                            fileEdit.after = content
                        }
                    if (oannotations) annotations = oannotations.slice(0)
                }
            } catch (e) {
                trace.error(`output processor failed`, e)
            } finally {
                trace.endDetails()
            }
        }

        // convert file edits into edits
        Object.entries(fileEdits)
            .filter(([, { before, after }]) => before !== after) // ignore unchanged files
            .forEach(([fn, { before, after }]) => {
                if (before) {
                    edits.push({
                        label: `Update ${fn}`,
                        filename: fn,
                        type: "replace",
                        range: [[0, 0], stringToPos(after)],
                        text: after,
                    })
                } else {
                    edits.push({
                        label: `Create ${fn}`,
                        filename: fn,
                        type: "createfile",
                        text: after,
                        overwrite: true,
                    })
                }
            })

        // reporting
        if (edits.length)
            trace.details(
                "✏️ edits",
                CSVToMarkdown(edits, {
                    headers: ["type", "filename", "message"],
                })
            )
        if (annotations?.length)
            trace.details(
                "⚠️ annotations",
                CSVToMarkdown(annotations, {
                    headers: ["severity", "filename", "line", "message"],
                })
            )

        trace.renderErrors()
        const res: GenerationResult = {
            status:
                finishReason === "cancel"
                    ? "cancelled"
                    : finishReason === "stop"
                      ? "success"
                      : "error",
            error,
            messages,
            vars,
            edits,
            annotations,
            changelogs,
            fileEdits,
            trace: trace.content,
            text,
            version,
            fences,
            frames,
            genVars,
            schemas,
            json,
        }
        options?.infoCb?.({
            label: res.label,
            vars: res.vars,
            text: undefined,
        })
        return res
    } finally {
        await host.removeContainers()
    }
}
