import {
    ChatCompletionResponse,
    ChatCompletionTool,
    processChatMessage,
} from "./chat"
import { Fragment, Project, PromptScript } from "./ast"
import { commentAttributes, stringToPos } from "./parser"
import { assert, logVerbose, relativePath } from "./util"
import {
    extractFenced,
    renderFencedVariables,
    staticVars,
    undoublequote,
} from "./template"
import { host } from "./host"
import { applyLLMDiff, applyLLMPatch, parseLLMDiffs } from "./diff"
import { defaultUrlAdapters } from "./urlAdapters"
import { MarkdownTrace } from "./trace"
import { JSON5TryParse } from "./json5"
import { applyChangeLog, parseChangeLogs } from "./changelog"
import { parseAnnotations } from "./annotations"
import { validateFencesWithSchema } from "./schema"
import { CORE_VERSION } from "./version"
import { fileExists, readText } from "./fs"
import { estimateChatTokens } from "./tokens"
import { CSVToMarkdown } from "./csv"
import { GenerationOptions } from "./promptcontext"
import { traceCliArgs } from "./clihelp"
import { GenerationResult, expandTemplate } from "./expander"
import { resolveLanguageModel, resolveModelConnectionInfo } from "./models"
import { MAX_DATA_REPAIRS, MAX_TOOL_CALLS } from "./constants"
import { RequestError } from "./error"
import { createFetch } from "./fetch"

async function fragmentVars(
    trace: MarkdownTrace,
    template: PromptScript,
    frag: Fragment
) {
    const { file } = frag
    const project = file.project

    const fetch = await createFetch()
    const files: WorkspaceFile[] = []
    const fr = frag
    for (const ref of fr.references) {
        // what about URLs?
        if (/^https:\/\//.test(ref.filename)) {
            if (!files.find((lk) => lk.filename === ref.filename)) {
                let content: string = ""
                try {
                    const urlAdapters = defaultUrlAdapters.concat(
                        template.urlAdapters ?? []
                    )
                    let url = ref.filename
                    let adapter: UrlAdapter = undefined
                    for (const a of urlAdapters) {
                        const newUrl = a.matcher(url)
                        if (newUrl) {
                            url = newUrl
                            adapter = a
                            break
                        }
                    }
                    trace.item(`fetch ${url}`)
                    const resp = await fetch(url, {
                        headers: {
                            "Content-Type":
                                adapter?.contentType ?? "text/plain",
                        },
                    })
                    trace.itemValue(
                        `status`,
                        `${resp.status}, ${resp.statusText}`
                    )
                    if (resp.ok)
                        content =
                            adapter?.contentType === "application/json"
                                ? adapter.adapter(await resp.json())
                                : await resp.text()
                } catch (e) {
                    trace.error(`fetch def error`, e)
                }
                files.push({
                    filename: ref.filename,
                    content,
                })
            }
            continue
        }

        // check for existing file
        const projectFile = project.allFiles.find(
            (f) => f.filename === ref.filename
        )
        if (!projectFile) {
            trace.error(`reference ${ref.filename} not found`)
            continue
        }

        const fn = relativePath(host.projectFolder(), projectFile.filename)
        if (!files.find((lk) => lk.filename === fn))
            files.push({
                filename: fn,
                content: projectFile.content,
            })
    }
    const attrs = commentAttributes(frag)
    const secrets: Record<string, string> = {}
    for (const secret of template.secrets || []) {
        const value = await host.readSecret(secret)
        if (value) {
            trace.item(`secret \`${secret}\` used`)
            secrets[secret] = value
        } else trace.error(`secret \`${secret}\` not found`)
    }
    const vars: Partial<ExpansionVariables> = {
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
    return vars
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
    const {
        skipLLM,
        label,
        cliInfo,
        stats,
        trace,
        maxToolCalls = MAX_TOOL_CALLS,
    } = options
    const maxRepairs = MAX_DATA_REPAIRS
    const cancellationToken = options?.cancellationToken
    const version = CORE_VERSION

    const isCancelled = () => cancellationToken?.isCancellationRequested

    trace.heading(2, label || template.id)

    if (cliInfo) traceCliArgs(trace, template, fragment, options)

    const vars = await fragmentVars(trace, template, fragment)
    // override with options vars
    if (options.vars)
        vars.vars = { ...(vars.vars || {}), ...(options.vars || {}) }

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
        model,
        max_tokens,
        seed,
        responseType,
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
        return <GenerationResult>{
            status,
            statusText,
            prompt: messages,
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
        return <GenerationResult>{
            prompt: messages,
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
    const response_format = responseType ? { type: responseType } : undefined

    const updateStatus = (text?: string) => {
        options.infoCb?.({
            vars,
            text,
            label,
        })
    }

    let text: string
    const fileEdits: Record<string, { before: string; after: string }> = {}
    const changelogs: string[] = []
    let annotations: Diagnostic[] = []
    const edits: Edits[] = []
    const projFolder = host.projectFolder()
    const links: string[] = []
    const fp = fragment.file.filename
    const fragn = /^.\//.test(fp)
        ? host.resolvePath(projFolder, fragment.file.filename)
        : fp
    const ff = host.resolvePath(fp, "..")
    const refs = fragment.references
    const tools: ChatCompletionTool[] = functions?.length
        ? functions.map((f) => ({
              type: "function",
              function: f.definition as any,
          }))
        : undefined
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
    const connection = await resolveModelConnectionInfo({
        model,
    })
    if (!connection.token) {
        trace.error(`model connection error`, connection.info)
        throw new RequestError(403, "token not configured", connection.info)
    }

    const { completer } = resolveLanguageModel(template, options)
    let genVars: Record<string, string> = {}

    while (text === undefined && !isCancelled()) {
        let resp: ChatCompletionResponse
        try {
            try {
                trace.startDetails(
                    `🧠 llm request (${messages.length} messages)`
                )
                trace.itemValue(
                    `tokens`,
                    estimateChatTokens(model, messages, tools)
                )
                updateStatus()
                resp = await completer(
                    {
                        model,
                        temperature,
                        top_p: topP,
                        max_tokens,
                        seed,
                        messages,
                        stream: true,
                        response_format,
                        tools,
                    },
                    connection.token,
                    options,
                    trace
                )
            } finally {
                trace.endDetails()
                updateStatus()
            }
        } catch (error: unknown) {
            trace.error(`llm error`, error)
            if (error instanceof TypeError) {
                resp = {
                    text: "Unexpected error",
                }
            } else if (error instanceof RequestError) {
                trace.heading(3, `Request error`)
                if (error.body) {
                    trace.log(`> ${error.body.message}\n\n`)
                    trace.item(`type: \`${error.body.type}\``)
                    trace.item(`code: \`${error.body.code}\``)
                }
                trace.item(`status: \`${error.status}\`, ${error.statusText}`)
                resp = {
                    text: `Request error: \`${error.status}\`, ${error.statusText}\n`,
                }
            } else if (isCancelled()) {
                trace.heading(3, `Request cancelled`)
                trace.log(`The user requested to cancel the request.`)
                resp = { text: "Request cancelled" }
                error = undefined
            } else {
                trace.error(`fetch error`, error)
                resp = { text: "Unexpected error" }
            }

            updateStatus(`error`)
            return <GenerationResult>{
                prompt: messages,
                vars,
                trace: trace.content,
                error,
                text: resp?.text,
                edits,
                annotations,
                changelogs,
                fileEdits,
                label,
                version,
                fences: [],
                frames: [],
            }
        }
        if (resp.variables) genVars = { ...genVars, ...resp.variables }
        text = await processChatMessage(
            resp,
            messages,
            functions,
            schemas,
            options
        )
        updateStatus()
    }

    annotations = parseAnnotations(text)
    const json = /^\s*[{[]/.test(text)
        ? JSON5TryParse(text, undefined)
        : undefined
    const fences = json === undefined ? extractFenced(text) : []
    const frames: DataFrame[] = []

    // validate schemas in fences
    if (fences?.length) {
        trace.details("📩 code regions", renderFencedVariables(fences))
        frames.push(...validateFencesWithSchema(fences, schemas, { trace }))
    }

    if (json !== undefined) {
        trace.detailsFenced("📩 json (parsed)", json, "json")
        const fn = fragment.file.filename.replace(
            /\.gpspec\.md$/i,
            "." + template.id + ".json"
        )
        const fileEdit = await getFileEdit(fn)
        fileEdit.after = text
    } else {
        for (const fence of fences.filter(
            ({ validation }) => validation?.valid !== false
        )) {
            const { label: name, content: val } = fence
            const pm = /^((file|diff):?)\s+/i.exec(name)
            if (pm) {
                const kw = pm[1].toLowerCase()
                const n = undoublequote(name.slice(pm[0].length).trim())
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
                if (!curr && fragn !== fn) links.push(`-   [${ffn}](${ffn})`)
            } else if (/^changelog$/i.test(name)) {
                changelogs.push(val)
                const cls = parseChangeLogs(val)
                for (const changelog of cls) {
                    const { filename } = changelog
                    const fn = /^[^\/]/.test(filename)
                        ? host.resolvePath(projFolder, filename)
                        : filename
                    const ffn = relativePath(ff, fn)
                    const curr = refs.find((r) => r.filename === fn)?.filename

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
            CSVToMarkdown(edits, { headers: ["type", "filename", "message"] })
        )
    if (annotations?.length)
        trace.details(
            "⚠️ annotations",
            CSVToMarkdown(annotations, {
                headers: ["severity", "filename", "line", "message"],
            })
        )

    const res: GenerationResult = {
        status: status,
        statusText,
        prompt: messages,
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
    }
    options?.infoCb?.({
        label: res.label,
        vars: res.vars,
        text: undefined,
    })
    return res
}
