import {
    ChatCompletionRequestMessage,
    ChatCompletionResponse,
    RequestError,
    toChatCompletionUserMessage,
} from "./chat"
import { Fragment, PromptTemplate } from "./ast"
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
import type { ChatCompletionTool } from "openai/resources"
import { exec } from "./exec"
import { applyChangeLog, parseChangeLogs } from "./changelog"
import { parseAnnotations } from "./annotations"
import { YAMLTryParse } from "./yaml"
import { validateJSONWithSchema } from "./schema"
import { CORE_VERSION } from "./version"
import { createCancelError } from "./error"
import { fileExists, readText } from "./fs"
import { estimateChatTokens } from "./tokens"
import { CSVToMarkdown } from "./csv"
import { RunTemplateOptions } from "./promptcontext"
import { traceCliArgs } from "./clihelp"
import { FragmentTransformResponse, expandTemplate } from "./expander"
import { resolveLanguageModel } from "./models"

async function fragmentVars(
    trace: MarkdownTrace,
    template: PromptTemplate,
    frag: Fragment
) {
    const { file } = frag
    const project = file.project

    const files: LinkedFile[] = []
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
                    label: ref.name,
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
                label: ref.name,
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
            label: "context",
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
    template: PromptTemplate,
    fragment: Fragment,
    options: RunTemplateOptions
): Promise<FragmentTransformResponse> {
    assert(fragment !== undefined)
    const {
        skipLLM,
        label,
        cliInfo,
        trace = new MarkdownTrace(),
    } = options || {}
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
        expanded,
        images,
        schemas,
        functions,
        fileMerges,
        outputProcessors,
        success,
        temperature,
        topP,
        model,
        max_tokens,
        seed,
        systemText,
        responseType,
    } = await expandTemplate(
        template,
        fragment,
        options,
        vars as ExpansionVariables,
        trace
    )

    // initial messages (before tools)
    const messages: ChatCompletionRequestMessage[] = [
        {
            role: "system",
            content: systemText,
        },
        toChatCompletionUserMessage(expanded, images),
    ]

    // if the expansion failed, show the user the trace
    if (!success) {
        const text = success === null ? "Script cancelled" : "Script failed"
        return <FragmentTransformResponse>{
            error: success === null ? createCancelError(text) : new Error(text),
            prompt: messages,
            vars,
            trace: trace.content,
            text,
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
        return <FragmentTransformResponse>{
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

    const status = (text?: string) => {
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
    let summary: string = undefined
    const projFolder = host.projectFolder()
    const links: string[] = []
    const fp = fragment.file.filename
    const fragn = /^.\//.test(fp)
        ? host.resolvePath(projFolder, fragment.file.filename)
        : fp
    const ff = host.resolvePath(fp, "..")
    const refs = fragment.references
    const fragmentVirtual = await fileExists(fragment.file.filename, {
        virtual: true,
    })
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
    const { completer } = resolveLanguageModel(model, options)

    while (!isCancelled()) {
        let resp: ChatCompletionResponse
        try {
            try {
                status(`prompting model ${model}`)
                trace.startDetails(
                    `🧠 llm request (${messages.length} messages)`
                )
                trace.item(
                    `tokens: ${estimateChatTokens(model, messages, tools)}`
                )
                status()
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
                    { ...options, trace }
                )
            } finally {
                trace.endDetails()
                status()
            }
        } catch (error: unknown) {
            if (error instanceof TypeError) {
                trace.heading(3, `Request error`)
                trace.item(error.message)
                if (error.cause) trace.fence(error.cause)
                if (error.stack) trace.fence(error.stack)
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
                trace.heading(3, `Fetch error`)
                trace.error(`fetch error`, error)
                resp = { text: "Unexpected error" }
            }

            status(`error`)
            return <FragmentTransformResponse>{
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

        if (resp.text) {
            trace.startDetails("📩 llm response")
            if (resp.finishReason && resp.finishReason !== "stop")
                trace.itemValue(`finish reason`, resp.finishReason)
            trace.detailsFenced(`output`, resp.text, "markdown")
            trace.endDetails()
        }

        status()
        if (resp.toolCalls?.length) {
            if (resp.text)
                messages.push({
                    role: "assistant",
                    content: resp.text,
                })
            messages.push({
                role: "assistant",
                content: null,
                tool_calls: resp.toolCalls.map((c) => ({
                    id: c.id,
                    function: {
                        name: c.name,
                        arguments: c.arguments,
                    },
                    type: "function",
                })),
            })

            // call tool and run again
            for (const call of resp.toolCalls) {
                if (isCancelled()) break
                try {
                    status(`running tool ${call.name}`)
                    trace.startDetails(`📠 tool call ${call.name}`)
                    trace.itemValue(`id`, call.id)
                    trace.itemValue(`args`, call.arguments)

                    const callArgs: any = call.arguments
                        ? JSON5TryParse(call.arguments)
                        : undefined
                    const fd = functions.find(
                        (f) => f.definition.name === call.name
                    )
                    if (!fd) throw new Error(`function ${call.name} not found`)

                    const context: ChatFunctionCallContext = {
                        trace,
                    }

                    let output = await fd.fn({ context, ...callArgs })
                    if (typeof output === "string") output = { content: output }
                    if (output?.type === "shell") {
                        let {
                            command,
                            args = [],
                            stdin,
                            cwd,
                            timeout,
                            ignoreExitCode,
                            files,
                            outputFile,
                        } = output
                        trace.item(
                            `shell command: \`${command}\` ${args.join(" ")}`
                        )
                        status()
                        const { stdout, stderr, exitCode } = await exec(host, {
                            trace,
                            label: call.name,
                            call: {
                                type: "shell",
                                command,
                                args,
                                stdin,
                                files,
                                outputFile,
                                cwd: cwd ?? projFolder,
                                timeout: timeout ?? 60000,
                            },
                        })
                        output = { content: stdout }
                        trace.itemValue(`exit code`, exitCode)
                        if (stdout) trace.details("📩 shell output", stdout)
                        if (stderr) trace.details("📩 shell error", stderr)
                        if (exitCode !== 0 && !ignoreExitCode)
                            throw new Error(
                                `tool ${call.name} failed with exit code ${exitCode}}`
                            )
                        status()
                    }

                    const { content, edits: functionEdits } = output

                    if (content) trace.fence(content, "markdown")
                    if (functionEdits?.length) {
                        trace.fence(functionEdits)
                        edits.push(
                            ...functionEdits.map((e) => {
                                const { filename, ...rest } = e
                                const n = e.filename
                                const fn = /^[^\/]/.test(n)
                                    ? host.resolvePath(projFolder, n)
                                    : n
                                return { filename: fn, ...rest }
                            })
                        )
                    }

                    messages.push({
                        role: "tool",
                        content,
                        tool_call_id: call.id,
                    })
                } catch (e) {
                    trace.error(`function failed`, e)
                    status(`error`)
                    throw e
                } finally {
                    trace.endDetails()
                    status()
                }
            }
        } else {
            text =
                messages
                    .filter((msg) => msg.role === "assistant" && msg.content)
                    .map((m) => m.content)
                    .join("\n") + resp.text
            break
        }
    }

    annotations = parseAnnotations(text)
    const json = JSON5TryParse(text, undefined)
    const fences = json === undefined ? extractFenced(text) : []
    const frames: DataFrame[] = []

    // validate schemas in fences
    for (const fence of fences.filter(
        ({ language }) => language === "json" || language === "yaml"
    )) {
        const { language, content: val, args } = fence
        // validate well formed json/yaml
        const data =
            language === "json" ? JSON5TryParse(val) : YAMLTryParse(val)
        if (data === undefined) {
            trace.error(`invalid ${language} syntax`)
            continue
        }
        // check if schema specified
        const schema = args?.schema
        const schemaObj = schema && schemas[schema]
        if (schema) {
            if (!schemaObj) trace.error(`schema ${schema} not found`)
            fence.validation = validateJSONWithSchema(trace, data, schemaObj)
            frames.push({
                schema,
                data,
                validation: fence.validation,
            })
        } else frames.push({ data })
    }

    if (fences?.length)
        trace.details("📩 code regions", renderFencedVariables(fences))

    if (json !== undefined) {
        trace.detailsFenced("📩 json (parsed)", json)
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
            } else if (/^summary$/i.test(name)) {
                summary = val
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
                    files = {},
                    annotations: oannotations = [],
                } = (await outputProcessor({
                    text,
                    fileEdits,
                    fences,
                    frames,
                })) || {}

                if (newText !== undefined) {
                    text = newText
                    trace.detailsFenced(`📝 text`, text)
                }

                for (const [fn, content] of Object.entries(files)) {
                    trace.detailsFenced(`📁 file ${fn}`, content)
                    const fileEdit = await getFileEdit(fn)
                    fileEdit.after = content
                }
                if (oannotations.length) {
                    trace.details(
                        "⚠️ annotations",
                        CSVToMarkdown(oannotations, {
                            headers: [
                                "severity",
                                "filename",
                                "line",
                                "message",
                            ],
                        })
                    )
                    annotations.push(...oannotations)
                }
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
    if (annotations.length)
        trace.details(
            "⚠️ annotations",
            CSVToMarkdown(annotations, {
                headers: ["severity", "filename", "line", "message"],
            })
        )

    const res: FragmentTransformResponse = {
        prompt: messages,
        vars,
        edits,
        annotations,
        changelogs,
        fileEdits,
        trace: trace.content,
        text,
        summary,
        version,
        fences,
        frames,
    }
    options?.infoCb?.(res)
    return res
}
