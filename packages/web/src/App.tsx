/// <reference path="../../core/src/types/prompt_template.d.ts" />
/// <reference path="./vscode-elements.d.ts" />
import React, {
    createContext,
    startTransition,
    use,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react"

import "@vscode-elements/elements/dist/vscode-button"
import "@vscode-elements/elements/dist/vscode-single-select"
import "@vscode-elements/elements/dist/vscode-option"
import "@vscode-elements/elements/dist/vscode-textfield"
import "@vscode-elements/elements/dist/vscode-checkbox"
import "@vscode-elements/elements/dist/vscode-form-container"
import "@vscode-elements/elements/dist/vscode-form-group"
import "@vscode-elements/elements/dist/vscode-form-helper"
import "@vscode-elements/elements/dist/vscode-label"
import "@vscode-elements/elements/dist/vscode-progress-ring"
import "@vscode-elements/elements/dist/vscode-collapsible"
import "@vscode-elements/elements/dist/vscode-tabs"
import "@vscode-elements/elements/dist/vscode-tab-header"
import "@vscode-elements/elements/dist/vscode-tab-panel"
import "@vscode-elements/elements/dist/vscode-badge"
import "@vscode-elements/elements/dist/vscode-textarea"
import "@vscode-elements/elements/dist/vscode-multi-select"
import "@vscode-elements/elements/dist/vscode-scrollable"
import "@vscode-elements/elements/dist/vscode-tree"
import "@vscode-elements/elements/dist/vscode-split-layout"

import Markdown from "./Markdown"
import type { GenerationResult } from "../../core/src/server/messages"
import { logprobColor, renderLogprob, rgbToCss } from "../../core/src/logprob"
import { useDropzone } from "react-dropzone"
import prettyBytes from "pretty-bytes"
import { renderMessagesToMarkdown } from "../../core/src/chatrender"
import { stringify as YAMLStringify } from "yaml"
import { fenceMD } from "../../core/src/mkmd"
import { isBinaryMimeType } from "../../core/src/binary"
import { toBase64 } from "../../core/src/base64"
import { lookupMime } from "../../core/src/mime"
import dedent from "dedent"
import { markdownDiff } from "../../core/src/mddiff"
import { convertAnnotationToItem } from "../../core/src/annotations"
import { VscodeMultiSelect } from "@vscode-elements/elements/dist/vscode-multi-select/vscode-multi-select"
import { VscTabsSelectEvent } from "@vscode-elements/elements/dist/vscode-tabs/vscode-tabs"
import MarkdownPreviewTabs from "./MarkdownPreviewTabs"
import { roundWithPrecision } from "../../core/src/precision"
import {
    TreeItem,
    TreeItemIconConfig,
    VscodeTree,
    VscTreeSelectEvent,
} from "@vscode-elements/elements/dist/vscode-tree/vscode-tree"
import CONFIGURATION from "../../core/src/llms.json"
import { MODEL_PROVIDER_GITHUB_COPILOT_CHAT } from "../../core/src/constants"
import {
    DetailsNode,
    parseTraceTree,
    renderTraceTree,
    TraceNode,
} from "../../core/src/traceparser"
import { unmarkdown } from "../../core/src/cleaners"
import { ErrorBoundary } from "react-error-boundary"
import { apiKey, diagnostics, hosted, viewMode } from "./configuration"
import { JSONBooleanOptionsGroup, JSONSchemaObjectForm } from "./JSONSchema"
import { useLocationHashValue } from "./useLocationHashValue"
import { ActionButton } from "./ActionButton"
import Suspense from "./Suspense"
import type {
    ChatCompletion,
    ChatCompletionMessageParam,
} from "../../core/src/chattypes"
import { generateId } from "../../core/src/id"
import { prettyCost, prettyDuration, prettyTokens } from "../../core/src/pretty"
import { useEventListener } from "./useEventListener"
import { RunClient } from "./RunClient"
import { fetchRun } from "./api"
import {
    RunClientProvider,
    useClientReadyState,
    useRunClient,
} from "./RunClientContext"
import {
    useApi,
    useScripts,
    useEnv,
    useScript,
    ImportedFile,
    useRunResults,
    useModels,
    ApiProvider,
} from "./ApiContext"

function useSyncProjectScript() {
    const { scriptid, setScriptid } = useApi()
    const { runId } = useRunner()
    const scripts = useScripts()
    useEffect(() => {
        if (!scriptid && scripts.length > 0) {
            if (!runId) setScriptid(scripts[0].id)
        } else if (scriptid && !scripts.find((s) => s.id === scriptid)) {
            setScriptid(runId ? undefined : scripts[0]?.id)
        }
    }, [scripts, scriptid, runId])
}

const RunnerContext = createContext<{
    runId: string | undefined
    run: () => void
    cancel: () => void
    state: "running" | undefined
    result: Partial<GenerationResult> | undefined
    trace: string
    output: string
    loadRunResult: (runId: string) => void
} | null>(null)

function RunnerProvider({ children }: { children: React.ReactNode }) {
    const { client } = useRunClient()
    const {
        scriptid,
        files = [],
        importedFiles = [],
        options,
        parameters,
    } = useApi()

    const [state, setState] = useState<"running" | undefined>(undefined)
    const [runId, setRunId] = useLocationHashValue("runid")
    const [result, setResult] = useState<Partial<GenerationResult> | undefined>(
        client.result
    )
    const [trace, setTrace] = useState<string>(client.trace)
    const [output, setOutput] = useState<string>(client.output)

    const start = useCallback((e: Event) => {
        const ev = e as CustomEvent
        setRunId(ev.detail.runId)
    }, [])
    useEventListener(client, RunClient.SCRIPT_START_EVENT, start, false)

    const runUpdate = useCallback(
        (e: Event) =>
            startTransition(() => {
                setRunId(client.runId)
                setState("running")
            }),
        [client]
    )
    useEventListener(client, RunClient.RUN_EVENT, runUpdate, false)

    const end = useCallback(
        (e: Event) =>
            startTransition(() => {
                setState(undefined)
                if (runId === client.runId) setResult(client.result)
            }),
        [client, runId]
    )
    useEventListener(client, RunClient.SCRIPT_END_EVENT, end, false)

    const appendTrace = useCallback(
        (evt: Event) =>
            startTransition(() => {
                setTrace(() => client.trace)
                setOutput(() => client.output)
            }),
        []
    )
    useEventListener(client, RunClient.PROGRESS_EVENT, appendTrace)

    const run = async () => {
        if (!scriptid) return

        const runId = generateId()
        const workspaceFiles = await Promise.all(
            importedFiles
                .filter(({ selected }) => selected)
                .map(async (f) => {
                    const binary = isBinaryMimeType(f.type)
                    const buffer = binary
                        ? new Uint8Array(await f.arrayBuffer())
                        : undefined
                    const content = buffer ? toBase64(buffer) : await f.text()
                    return {
                        filename: f.path || f.relativePath,
                        type: f.type,
                        encoding: binary ? "base64" : undefined,
                        content,
                        size: f.size,
                    } satisfies WorkspaceFile
                })
        )
        client.startScript(runId, scriptid, files, {
            ...(options || {}),
            vars: parameters,
            workspaceFiles,
        })
    }

    const cancel = () => {
        client.abortScript(runId, "ui cancel")
        setRunId(undefined)
        setState(undefined)
    }

    const loadRunResult = async (runId: string) => {
        if (!runId) return
        const res = await fetchRun(runId)
        if (res)
            startTransition(() => {
                client.cancel("load run")
                setRunId(runId)
                setResult(res.result)
                setTrace(res.trace)
                setOutput(res.result?.text)
                setState(undefined)
            })
    }

    useEffect(() => {
        if (runId) loadRunResult(runId)
    }, [])

    return (
        <RunnerContext.Provider
            value={{
                runId,
                run,
                cancel,
                state,
                result,
                trace,
                output,
                loadRunResult,
            }}
        >
            {children}
        </RunnerContext.Provider>
    )
}

function useRunner() {
    const runner = use(RunnerContext)
    if (!runner) throw new Error("runner context not configured")
    return runner
}

function useResult(): Partial<GenerationResult> | undefined {
    const { result } = useRunner()
    return result
}

function useTrace() {
    const { trace } = useRunner()
    return trace
}

function useOutput() {
    const { output } = useRunner()
    return output
}

function useReasoning() {
    const { client } = useRunClient()
    const [value, setValue] = useState<string>(client.reasoning)
    const appendReasoning = useCallback(
        () => startTransition(() => setValue(() => client.reasoning)),
        [client]
    )
    useEventListener(client, RunClient.PROGRESS_EVENT, appendReasoning)
    return value
}

function GenAIScriptLogo(props: { height: string }) {
    const { height } = props
    return (
        <img
            alt="GenAIScript logo"
            src="/favicon.svg"
            style={{ height, borderRadius: "2px" }}
        />
    )
}

function ProjectView() {
    return (
        <vscode-collapsible title={"Project"}>
            <Suspense>
                <ProjectHeader />
            </Suspense>
        </vscode-collapsible>
    )
}

function ProjectHeader() {
    const env = useEnv()
    const { remote, configuration } = env || {}
    const { name, description, version, homepage, author, readme } =
        configuration || {}
    if (!configuration) return null

    const { url, branch } = remote || {}
    const remoteSlug = url ? `${url}${branch ? `#${branch}` : ""}` : undefined

    const markdown = useMemo(() => {
        const res: string[] = [
            !!remoteSlug &&
                `- remote: [${remoteSlug}](https://github.com/${remoteSlug})`,
            readme || description,
        ]
        return res.filter((s) => !!s).join("\n")
    }, [description, remoteSlug, version, readme])

    return (
        <>
            {remoteSlug ? (
                <vscode-badge variant="counter" slot="decorations">
                    {remoteSlug}
                </vscode-badge>
            ) : null}
            {markdown ? (
                <div className="readme">
                    <Markdown readme={true}>{markdown}</Markdown>
                </div>
            ) : null}
        </>
    )
}

function ValueBadge(props: {
    value: any
    precision?: number
    title: string
    render?: (value: any) => string
}) {
    const { value, title, render, precision } = props
    if (
        value === undefined ||
        value === null ||
        (typeof value === "number" && isNaN(value)) ||
        value === ""
    )
        return null
    const s = render
        ? render(value)
        : precision
          ? roundWithPrecision(value, precision)
          : "" + value
    if (s === "") return null
    return (
        <vscode-badge title={title} variant="counter" slot="content-after">
            {s}
        </vscode-badge>
    )
}

function CounterBadge(props: { collection: any | undefined; title: string }) {
    const { collection } = props
    let count: string | undefined = undefined
    if (Array.isArray(collection)) {
        if (collection.length > 0) count = "" + collection.length
    } else if (collection) count = "1"

    return count ? (
        <vscode-badge variant="counter" slot="content-after">
            {count}
        </vscode-badge>
    ) : (
        ""
    )
}

const parseTreeIcons: TreeItemIconConfig = {
    leaf: "none",
    branch: "chevron-right",
    open: "chevron-down",
}

function traceTreeToTreeItem(node: TraceNode): TreeItem {
    if (typeof node === "string") return undefined
    switch (node.type) {
        case "details":
            return {
                label: unmarkdown(node.label),
                value: node.id,
                icons: parseTreeIcons,
                open: node.open,
                subItems: node.content
                    ?.map(traceTreeToTreeItem)
                    ?.filter((s) => s),
            }
        case "item":
            return {
                label: unmarkdown(node.label),
                value: node.id,
                description: node.value,
            }
    }
}

function TraceTreeMarkdown() {
    const trace = useTrace()
    const { runId } = useRunner()
    const [node, setNode] = useState<TraceNode | undefined>(undefined)
    const openeds = useRef(new Set<string>())
    const tree = useMemo(() => {
        const res = parseTraceTree(trace, {
            parseItems: false,
            openeds: openeds.current,
        })
        openeds.current = new Set<string>(
            Object.values(res.nodes)
                .filter(
                    (n) =>
                        typeof n !== "string" && n.type === "details" && n.open
                )
                .map((n) => (n as DetailsNode).id)
        )
        return res
    }, [trace])
    const data = useMemo(() => {
        const newData = traceTreeToTreeItem(tree.root)
        newData.open = true
        return [newData]
    }, [tree])
    const treeRef = useRef(null)
    const handleSelect = (e: VscTreeSelectEvent) => {
        const { value, open } = e.detail
        if (open) openeds.current.add(value)
        else openeds.current.delete(value)
        if (!value) return
        const selected = tree.nodes[value]
        setNode(() => selected)
    }
    const preview = useMemo(() => {
        if (!node) return undefined
        if (typeof node === "object" && node?.type === "details")
            return node.content.map((n) => renderTraceTree(n, 2)).join("\n")
        return renderTraceTree(node, 2)
    }, [node])

    useEffect(() => {
        setNode(() => undefined)
    }, [runId])

    return (
        <vscode-split-layout
            className="trace-split-panel"
            initial-handle-position="20%"
            fixed-pane="start"
        >
            <div slot="start">
                <vscode-scrollable>
                    <vscode-tree
                        data={data}
                        ref={treeRef}
                        indentGuides={true}
                        onvsc-tree-select={handleSelect}
                    />
                </vscode-scrollable>
            </div>
            <div slot="end">
                <vscode-scrollable>
                    {preview ? <Markdown>{preview}</Markdown> : null}
                </vscode-scrollable>
            </div>
        </vscode-split-layout>
    )
}

function TraceTabPanel(props: { selected?: boolean }) {
    const { selected } = props
    return (
        <>
            <vscode-tab-header slot="header">
                Trace
                <ErrorStatusBadge />
            </vscode-tab-header>
            <vscode-tab-panel>
                <ErrorBoundary
                    fallback={
                        <p>⚠️Something went wrong while rendering trace.</p>
                    }
                >
                    {selected ? <TraceTreeMarkdown /> : null}
                </ErrorBoundary>
            </vscode-tab-panel>
        </>
    )
}

function OutputMarkdown() {
    const output = useOutput()
    const reasoning = useReasoning()
    if (!output && !reasoning) return null

    let markdown = ``
    if (reasoning)
        markdown += `<details class="reasoning"><summary>🤔 thinking...</summary>\n${reasoning}\n</details>\n\n`
    if (output) markdown += output
    return (
        <vscode-tabs className="output">
            <MarkdownPreviewTabs
                aiDisclaimer={true}
                filename="output.md"
                renderText={markdown}
                text={output}
            />
            <LogProbsTabPanel />
            <EntropyTabPanel />
            <TopLogProbsTabPanel />
        </vscode-tabs>
    )
}

function RunningPlaceholder() {
    const { state } = useRunner()
    if (state !== "running") return null

    return (
        <vscode-icon
            style={{ margin: "1rem" }}
            name="loading"
            spin
            spin-duration="1"
        />
    )
}

function ChoicesBadge() {
    const { choices } = useResult() || {}
    if (!choices?.length) return null

    return (
        <vscode-badge title="choice" variant="default" slot="content-after">
            {choices.map((c) => c.token).join(", ")}
        </vscode-badge>
    )
}

function OutputTabPanel(props: { selected?: boolean }) {
    const { selected } = props
    return (
        <>
            <vscode-tab-header slot="header">
                Output
                <ChoicesBadge />
            </vscode-tab-header>
            <vscode-tab-panel>
                {selected ? <OutputMarkdown /> : null}
                <RunningPlaceholder />
            </vscode-tab-panel>
        </>
    )
}

function ErrorTabPanel() {
    const result = useResult()
    const { error } = result || {}
    if (!error) return null
    return (
        <>
            <vscode-tab-header slot="header">Errors</vscode-tab-header>
            <vscode-tab-panel>
                <Markdown>{fenceMD(error?.message, "markdown")}</Markdown>
                <Markdown>{fenceMD(error?.stack, "txt")}</Markdown>
            </vscode-tab-panel>
        </>
    )
}

function ProblemsTabPanel() {
    const result = useResult()
    const { annotations = [] } = result || {}
    if (annotations.length === 0) return null

    const annotationsMarkdown = annotations
        .map(convertAnnotationToItem)
        .join("\n")

    return (
        <>
            <vscode-tab-header slot="header">
                Problems
                <CounterBadge
                    title="number of errors, warnings found"
                    collection={annotations}
                />
            </vscode-tab-header>
            <vscode-tab-panel>
                <Markdown>{annotationsMarkdown}</Markdown>
            </vscode-tab-panel>
        </>
    )
}

function ChatMessages(props: { messages: ChatCompletionMessageParam[] }) {
    const { messages = [] } = props
    if (!messages.length) return null
    const mdPromise = useMemo(
        () =>
            renderMessagesToMarkdown(messages, {
                system: true,
                user: true,
                assistant: true,
            }),
        [messages]
    )
    const md = use(mdPromise)
    return (
        <>
            <Suspense>
                <Markdown copySaveButtons={true}>{md}</Markdown>
            </Suspense>
        </>
    )
}

function MessagesTabPanel() {
    const result = useResult()
    const { messages = [] } = result || {}
    if (!messages.length) return null
    return (
        <>
            <vscode-tab-header slot="header">
                Chat
                <CounterBadge
                    title="number of messages in chat"
                    collection={messages}
                />
            </vscode-tab-header>
            <vscode-tab-panel>
                <ChatMessages messages={messages} />
            </vscode-tab-panel>
        </>
    )
}

function ErrorStatusBadge() {
    const result = useResult()
    const { status } = result || {}
    if (!status || status === "success") return null
    return (
        <vscode-badge title="error" variant="counter" slot="content-after">
            !
        </vscode-badge>
    )
}

function StatsBadge() {
    const result = useResult() || {}
    const { stats } = result || {}
    if (!stats) return null
    const { cost, prompt_tokens, completion_tokens, duration } = stats
    if (!cost && !completion_tokens) return null
    return (
        <>
            {[
                prettyDuration(duration),
                prettyTokens(prompt_tokens),
                prettyTokens(completion_tokens),
                prettyCost(cost),
            ]
                .filter((l) => !!l)
                .map((s, i) => (
                    <vscode-badge
                        key={i}
                        title="usage"
                        variant="counter"
                        slot="content-after"
                    >
                        {s}
                    </vscode-badge>
                ))}
        </>
    )
}

function StatsTabPanel() {
    const result = useResult()
    const { stats } = result || {}
    if (!stats) return null
    const { cost, ...rest } = stats || {}

    const md = stats
        ? YAMLStringify(rest)
              .replace(/_/g, " ")
              .replace(/^(\s*)([a-z])/gm, (m, s, l) => `${s}- ${l}`)
        : ""
    return (
        <>
            <vscode-tab-header slot="header">
                Usage
                <StatsBadge />
            </vscode-tab-header>
            <vscode-tab-panel>
                {md ? <Markdown>{md}</Markdown> : null}
            </vscode-tab-panel>
        </>
    )
}

function LogProb(props: {
    value: Logprob
    maxIntensity?: number
    eatSpaces?: boolean
    entropy?: boolean
}) {
    const { value, maxIntensity, entropy, eatSpaces } = props
    const { token, logprob, topLogprobs } = value
    const c = rgbToCss(logprobColor(value, { entropy, maxIntensity }))
    const title = [
        renderLogprob(logprob),
        isNaN(value.entropy)
            ? undefined
            : `entropy: ${roundWithPrecision(value.entropy, 2)}`,
        topLogprobs?.length
            ? `top logprobs:\n${topLogprobs.map((t) => `-  ${t.token}: ${renderLogprob(t.logprob)}`).join("\n")}`
            : undefined,
    ]
        .filter((t) => !!t)
        .join("\n")

    let text = token
    if (eatSpaces) text = text.replace(/\n/g, " ")
    return (
        <span className="logprobs" title={title} style={{ background: c }}>
            {text}
        </span>
    )
}

function LogProbsTabPanel() {
    const result = useResult()
    const { logprobs, perplexity } = result || {}
    if (!logprobs?.length) return null
    return (
        <>
            <vscode-tab-header slot="header">
                Perplexity
                <ValueBadge
                    title="perplexity"
                    value={perplexity}
                    precision={3}
                />
            </vscode-tab-header>
            <vscode-tab-panel>
                <div className={"markdown-body"}>
                    {logprobs?.map((lp, i) => <LogProb key={i} value={lp} />)}
                </div>
            </vscode-tab-panel>
        </>
    )
}

function EntropyTabPanel() {
    const result = useResult()
    const { logprobs } = result || {}
    if (!logprobs?.length) return null
    return (
        <>
            <vscode-tab-header slot="header">Entropy</vscode-tab-header>
            <vscode-tab-panel>
                <div className={"markdown-body"}>
                    {logprobs?.map((lp, i) => (
                        <LogProb key={i} value={lp} entropy={true} />
                    ))}
                </div>
            </vscode-tab-panel>
        </>
    )
}

function TopLogProbsTabPanel() {
    const result = useResult()
    const { logprobs, uncertainty } = result || {}
    if (!logprobs?.length) return null
    return (
        <>
            <vscode-tab-header slot="header">
                Uncertainty
                <ValueBadge
                    value={uncertainty}
                    title="uncertainty"
                    precision={3}
                />
            </vscode-tab-header>
            <vscode-tab-panel>
                <div className={"markdown-body"}>
                    {logprobs?.map((lp, i) => (
                        <table key={i} className="toplogprobs">
                            <tr>
                                <td>
                                    {lp.topLogprobs?.map((tlp, j) => (
                                        <LogProb
                                            key={j}
                                            value={tlp}
                                            eatSpaces={true}
                                        />
                                    ))}
                                </td>
                            </tr>
                        </table>
                    ))}
                </div>
            </vscode-tab-panel>
        </>
    )
}

function FileEditsTabPanel() {
    const result = useResult()
    const { fileEdits = {} } = result || {}

    const files = Object.entries(fileEdits)
    if (files.length === 0) return null

    return (
        <>
            <vscode-tab-header slot="header">
                Edits
                <CounterBadge
                    title="number of edited files"
                    collection={files}
                />
            </vscode-tab-header>
            <vscode-tab-panel>
                <Markdown>
                    {files
                        ?.map(
                            ([filename, content], i) =>
                                dedent`### ${filename}
                    ${markdownDiff(content.before, content.after, { lang: "txt" })}
                    ${content.validation?.pathValid ? `- output path validated` : ""}
                    ${
                        content.validation?.schema
                            ? dedent`- JSON schema
                        \`\`\`json
                        ${JSON.stringify(content.validation.schema, null, 2)}
                        \`\`\``
                            : ""
                    }
                    ${content.validation?.schemaError ? `- error: ${content.validation.schemaError}` : ""}
                    `
                        )
                        .join("\n")}
                </Markdown>
            </vscode-tab-panel>
        </>
    )
}

function JSONTabPanel() {
    const result = useResult()
    const { json, frames = [] } = result || {}
    if (json === undefined && !frames?.length) return null
    return (
        <>
            <vscode-tab-header slot="header">
                Structured Output
                <CounterBadge
                    title="number of generated JSON objects"
                    collection={json}
                />
            </vscode-tab-header>
            <vscode-tab-panel>
                {json && (
                    <Markdown
                        filename="output.json"
                        text={JSON.stringify(json, null, 2)}
                    >
                        {`
\`\`\`\`\`json
${JSON.stringify(json, null, 2)}
\`\`\`\`\`
`}
                    </Markdown>
                )}
                {frames.map((frame, i) => (
                    <Markdown
                        key={i}
                        filename="data.json"
                        text={JSON.stringify(frame, null, 2)}
                    >
                        {`
\`\`\`\`\`json
${JSON.stringify(frame, null, 2)}
\`\`\`\`\`
`}
                    </Markdown>
                ))}
            </vscode-tab-panel>
        </>
    )
}

function RawTabPanel() {
    const result = useResult()
    return (
        <>
            <vscode-tab-header slot="header">Raw</vscode-tab-header>
            <vscode-tab-panel>
                {result && (
                    <Markdown>
                        {`
\`\`\`\`\`json
${JSON.stringify(result, null, 2)}
\`\`\`\`\`
`}
                    </Markdown>
                )}
            </vscode-tab-panel>
        </>
    )
}

function acceptToAccept(accept: string | undefined) {
    if (!accept) return undefined
    const res: Record<string, string[]> = {}
    const extensions = accept
        .split(",")
        .map((ext) => ext.trim().replace(/^\*\./, "."))
    for (const ext of extensions) {
        const mime = lookupMime(ext)
        if (mime) {
            const exts = res[mime] || (res[mime] = [])
            if (!exts.includes(ext)) exts.push(ext)
        }
    }
    return res
}

function FilesFormInput() {
    const script = useScript()
    const { accept } = script || {}
    if (!script || accept === "none") return null

    return <FilesDropZone script={script} />
}

function FilesDropZone(props: { script: PromptScript }) {
    const { script } = props
    const { accept } = script || {}
    const { acceptedFiles, isDragActive, getRootProps, getInputProps } =
        useDropzone({ multiple: true, accept: acceptToAccept(accept) })
    const { importedFiles, setImportedFiles } = useApi()

    useEffect(() => {
        const newImportedFiles = [...importedFiles]
        if (acceptedFiles?.length) {
            for (const f of acceptedFiles)
                if (!newImportedFiles.find((nf) => nf.path === f.path)) {
                    ;(f as ImportedFile).selected = true
                    newImportedFiles.push(f)
                }
        }
        if (newImportedFiles.length !== importedFiles.length)
            setImportedFiles(newImportedFiles)
    }, [importedFiles, acceptedFiles])

    return (
        <>
            <vscode-form-group>
                <vscode-label>Files</vscode-label>
                <vscode-multi-select
                    onChange={(e) => {
                        e.preventDefault()
                        const target = e.target as VscodeMultiSelect
                        const newImportedFiles = [...importedFiles]
                        const selected = target.selectedIndexes
                        for (let i = 0; i < newImportedFiles.length; i++) {
                            newImportedFiles[i].selected = selected.includes(i)
                        }
                        setImportedFiles(newImportedFiles)
                    }}
                >
                    {importedFiles.map((file) => (
                        <vscode-option
                            key={file.path}
                            value={file.path}
                            selected={file.selected}
                        >
                            {file.name} ({prettyBytes(file.size)})
                        </vscode-option>
                    ))}
                </vscode-multi-select>
            </vscode-form-group>
            <vscode-form-group
                className="dropzone"
                style={{
                    ...(isDragActive ? { outline: "2px dashed #333" } : {}),
                }}
                {...getRootProps({ className: "dropzone" })}
            >
                <input {...getInputProps()} />
                <vscode-form-helper>
                    {isDragActive
                        ? `Drop the files here ...`
                        : `Drag 'n' drop some files here, or click to select files ${accept ? `(${accept})` : ""}`}
                </vscode-form-helper>
            </vscode-form-group>
        </>
    )
}

function ScriptDescription() {
    const script = useScript()
    if (!script) return null
    const { title, description } = script
    return (
        <vscode-form-helper>
            {title ? <b>{title}</b> : null}
            {description ? (
                <Markdown readme={true} className="no-margins">
                    {description}
                </Markdown>
            ) : null}
        </vscode-form-helper>
    )
}

function RefreshButton() {
    const { refresh } = useApi()
    return (
        <ActionButton
            name="refresh"
            label="reload script list"
            onClick={refresh}
        />
    )
}

function ScriptSelect() {
    const scripts = useScripts()
    const { scriptid, setScriptid, refresh } = useApi()
    const { filename } = useScript() || {}

    return (
        <vscode-form-group>
            <vscode-label style={{ padding: 0 }}>
                <GenAIScriptLogo height="2em" />
            </vscode-label>
            <vscode-single-select
                id="script-selector"
                value={scriptid}
                combobox
                filter="fuzzy"
                onvsc-change={(e: Event) => {
                    const target = e.target as HTMLSelectElement
                    setScriptid(target.value)
                }}
                title={filename}
            >
                {scripts
                    .filter((s) => !s.isSystem && !s.unlisted)
                    .map(({ id, title }) => (
                        <vscode-option
                            value={id}
                            selected={scriptid === id}
                            description={title}
                        >
                            {id}
                        </vscode-option>
                    ))}
            </vscode-single-select>
            <ScriptDescription />
        </vscode-form-group>
    )
}

function ScriptForm() {
    return (
        <vscode-collapsible open title="Script">
            <RefreshButton />
            <ScriptSelect />
            <FilesFormInput />
            <PromptParametersFields />
            <RunScriptButton />
        </vscode-collapsible>
    )
}

function RunResultSelector() {
    const { loadRunResult } = useRunner()
    const { runs } = useRunResults() || {}
    const { scriptid } = useApi()
    const handleSelect = (e: Event) => {
        e.stopPropagation()
        const target = e.target as HTMLSelectElement
        const runId = target?.value
        loadRunResult(runId)
    }

    return (
        <vscode-form-group>
            <vscode-label>Runs</vscode-label>
            <vscode-single-select onvsc-change={handleSelect}>
                <vscode-option description="" value=""></vscode-option>
                {runs
                    ?.filter((r) => !scriptid || r.scriptId === scriptid)
                    .map((run) => (
                        <vscode-option
                            description={`${run.scriptId}, created at ${run.creationTime} (${run.runId})`}
                            value={run.runId}
                        >
                            {scriptid === run.scriptId
                                ? ""
                                : `${run.scriptId}, `}
                            {run.creationTime}
                        </vscode-option>
                    ))}
            </vscode-single-select>
            <vscode-form-helper>Select a previous report</vscode-form-helper>
        </vscode-form-group>
    )
}

function RunButtonOptions() {
    const script = useScript()

    const { parameters, setParameters } = useApi()
    const { inputSchema } = script || {}
    if (!Object.keys(inputSchema?.properties || {}).length) return null

    const scriptParameters = inputSchema.properties[
        "script"
    ] as JSONSchemaObject
    const runOptions: [string, JSONSchemaBoolean][] =
        scriptParameters?.properties
            ? Object.entries(
                  scriptParameters.properties as Record<
                      string,
                      JSONSchemaSimpleType
                  >
              )
                  .filter(
                      ([, f]) =>
                          f.type === "boolean" && f.uiType === "runOption"
                  )
                  .map(([k, f]) => [k, f as JSONSchemaBoolean])
            : undefined
    if (!runOptions) return null
    return (
        <vscode-form-group>
            <vscode-label></vscode-label>
            <JSONBooleanOptionsGroup
                properties={Object.fromEntries(runOptions)}
                value={parameters}
                fieldPrefix={""}
                onChange={setParameters}
            />
        </vscode-form-group>
    )
}

function PromptParametersFields() {
    const script = useScript()

    const { parameters, setParameters } = useApi()
    const { inputSchema } = script || {}
    if (!Object.keys(inputSchema?.properties || {}).length) return null

    const scriptParameters = inputSchema.properties[
        "script"
    ] as JSONSchemaObject
    const systemParameters = Object.entries(inputSchema.properties).filter(
        ([k]) => k !== "script"
    )
    return (
        <>
            {scriptParameters && (
                <JSONSchemaObjectForm
                    schema={scriptParameters}
                    value={parameters}
                    fieldPrefix={""}
                    onChange={setParameters}
                />
            )}
            {!!systemParameters.length && (
                <vscode-collapsible
                    className="collapsible"
                    title="System Parameters"
                >
                    {Object.entries(inputSchema.properties)
                        .filter(([k]) => k !== "script")
                        .map(([key, fieldSchema]) => {
                            return (
                                <JSONSchemaObjectForm
                                    schema={fieldSchema as JSONSchemaObject}
                                    value={parameters}
                                    fieldPrefix={`${key}.`}
                                    onChange={setParameters}
                                />
                            )
                        })}
                </vscode-collapsible>
            )}
        </>
    )
}

function ModelConfigurationTabPanel() {
    const { options, setOptions } = useApi()
    const env = useEnv()
    const { providers } = env || {}
    const models =
        providers?.flatMap(
            (p) => p.models?.map((m) => `${p.provider}:${m.id}`) || []
        ) || []

    const schema: JSONSchemaObject = {
        type: "object",
        properties: {
            cache: {
                type: "boolean",
                description: `Enable cache for LLM requests`,
                default: false,
            },
            model: {
                type: "string",
                description:
                    "'large' model identifier; this is the default model when no model is configured in the script.",
                default: "large",
                uiSuggestions: models,
            },
            smallModel: {
                type: "string",
                description: "'small' model identifier",
                default: "small",
                uiSuggestions: models,
            },
            visionModel: {
                type: "string",
                description: "'vision' model identifier",
                default: "vision",
                uiSuggestions: models,
            },
            temperature: {
                type: "number",
                description: "LLM temperature from 0 to 2",
                minimum: 0,
                maximum: 2,
                default: 0.8,
            },
            logprobs: {
                type: "boolean",
                description:
                    "Enable reporting log probabilities for each token",
                default: false,
            },
            topLogprobs: {
                type: "integer",
                description:
                    "Enables reporting log probabilities for alternate tokens",
                minimum: 0,
                maximum: 5,
                default: 0,
            },
        },
    }
    return (
        <>
            <vscode-tab-header slot="header">Model</vscode-tab-header>
            <vscode-tab-panel>
                <JSONSchemaObjectForm
                    schema={schema}
                    value={options}
                    fieldPrefix=""
                    onChange={setOptions}
                />
            </vscode-tab-panel>
        </>
    )
}

function ConfigurationTabPanel() {
    return (
        <vscode-collapsible className="collapsible" title="Configuration">
            <vscode-tabs panel>
                <ModelConfigurationTabPanel />
                <ProviderConfigurationTabPanel />
                <ChatCompletationTabPanel />
            </vscode-tabs>
        </vscode-collapsible>
    )
}

function ChatCompletationTabPanel() {
    const models = useModels()
    const [model, setModel] = useState<string>("")
    const [userContent, setUserContent] = useState<string>(
        "write a poem using emojis"
    )
    const [response, setResponse] = useState<
        ChatCompletion | { error?: string }
    >(undefined)
    const [controller, setController] = useState<AbortController | undefined>(
        undefined
    )
    const state = controller ? "running" : undefined
    const title = state === "running" ? "Abort" : "Run"

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (controller) controller.abort()
        const c = new AbortController()
        setController(c)
        setResponse(undefined)
        try {
            const body = {
                model: model,
                messages: [{ role: "user", content: userContent }],
            }
            const resp = await fetch("/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: apiKey,
                },
                signal: c.signal,
                body: JSON.stringify(body),
            })
            if (c.signal.aborted) {
                console.log(`openai request aborted`)
                return
            }
            if (!resp.ok)
                setResponse({
                    error: `Error: ${resp.status} ${resp.statusText}`,
                })
            else setResponse(await resp.json())
        } catch (e) {
            c.abort()
            setResponse({ error: `Error: ${e}` })
        } finally {
            setController(undefined)
        }
    }

    return (
        <>
            <vscode-tab-header slot="header">OpenAI API</vscode-tab-header>
            <vscode-tab-panel>
                <form onSubmit={handleSubmit}>
                    <vscode-form-group>
                        <vscode-label>model:</vscode-label>
                        <vscode-single-select
                            value={model}
                            combobox
                            filter="fuzzy"
                            creatable
                            onvsc-change={(e: Event) => {
                                const target = e.target as HTMLSelectElement
                                setModel(target.value)
                            }}
                        >
                            <vscode-option value=""></vscode-option>
                            {models?.data?.map((m) => (
                                <vscode-option key={m.id} value={m.id}>
                                    {m.id}
                                </vscode-option>
                            ))}
                        </vscode-single-select>
                    </vscode-form-group>
                    <vscode-form-container>
                        <vscode-form-group>
                            <vscode-label>user:</vscode-label>
                            <vscode-textarea
                                rows={5}
                                value={userContent}
                                onvsc-change={(e: Event) => {
                                    const target =
                                        e.target as HTMLTextAreaElement
                                    setUserContent(target.value)
                                }}
                                placeholder="user message"
                            ></vscode-textarea>
                        </vscode-form-group>
                        <vscode-form-group>
                            <vscode-label></vscode-label>
                            <vscode-button
                                icon={
                                    state === "running" ? "stop-circle" : "play"
                                }
                                type="submit"
                                title={title}
                            >
                                {title}
                            </vscode-button>
                            <ModelOptionsFormHelper />
                        </vscode-form-group>
                        {response ? (
                            <vscode-form-group>
                                <vscode-label></vscode-label>
                                <vscode-tabs>
                                    <MarkdownPreviewTabs
                                        text={JSON.stringify(response, null, 2)}
                                        renderText={
                                            (response as ChatCompletion)
                                                ?.choices?.length
                                                ? (
                                                      response as ChatCompletion
                                                  )?.choices
                                                      .map(
                                                          ({ message }) =>
                                                              message.content
                                                      )
                                                      .join("\n<br/>\n")
                                                : `
\`\`\`json
${JSON.stringify(response, null, 2) || ""}
\`\`\`
`
                                        }
                                    />
                                </vscode-tabs>
                            </vscode-form-group>
                        ) : null}
                    </vscode-form-container>
                </form>
            </vscode-tab-panel>
        </>
    )
}

function ProviderConfigurationTabPanel() {
    const env = useEnv()
    const { providers } = env || {}
    if (!providers?.length) return null

    const ref = useRef<VscodeTree | null>(null)
    useEffect(() => {
        if (!ref.current) return
        if (!providers) ref.current.data = []
        else {
            const icons = {
                leaf: "robot",
                branch: "chevron-right",
                open: "chevron-down",
            }
            const missingIcons = {
                branch: "circle-large",
                leaf: "circle-large",
                open: "chevron-down",
            }
            const errorIcons = {
                branch: "error",
                leaf: "error",
                open: "chevron-down",
            }
            const PROVIDERS = CONFIGURATION.providers
            const data: TreeItem[] = PROVIDERS.filter(
                ({ id }) => id !== MODEL_PROVIDER_GITHUB_COPILOT_CHAT
            )
                .map((def) => ({
                    ...(providers.find((p) => p.provider === def.id) || {}),
                    detail: def.detail,
                    provider: def.id,
                    url: def.url,
                    missing: !providers.find((p) => p.provider === def.id),
                }))
                .map(
                    (r) =>
                        ({
                            icons: r.error
                                ? errorIcons
                                : r.missing
                                  ? missingIcons
                                  : icons,
                            label: r.provider,
                            description: r.error ?? r.base,
                            tooltip: r.detail,
                            subItems: r.models?.map(
                                ({ id, url }) =>
                                    ({
                                        label: id,
                                        description: url,
                                    }) satisfies TreeItem
                            ),
                        }) satisfies TreeItem
                )
            ref.current.data = data
        }
    }, [providers])

    return (
        <>
            <vscode-tab-header slot="header">LLM Providers</vscode-tab-header>
            <vscode-tab-panel>
                <vscode-tree indent-guides indent={8} ref={ref} />
                <vscode-label>
                    <a href="https://microsoft.github.io/genaiscript/getting-started/configuration/">
                        Configuration documentation
                    </a>
                </vscode-label>
            </vscode-tab-panel>
        </>
    )
}

function ClientReadyStateLabel() {
    const readyState = useClientReadyState()
    if (readyState === "open") return null
    return (
        <vscode-label title={`server connection status: ${readyState}`}>
            {readyState}
        </vscode-label>
    )
}

function ModelOptionsFormHelper() {
    const { options } = useApi()
    return (
        <>
            <vscode-form-helper>
                {Object.entries(options)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(", ")}
            </vscode-form-helper>
        </>
    )
}

function RunScriptButton() {
    const { scriptid } = useApi()
    const { state } = useRunner()
    const disabled = !scriptid

    const title = state === "running" ? "Abort" : "Run"
    return (
        <>
            <vscode-form-group>
                <ClientReadyStateLabel />
                <vscode-button
                    icon={state === "running" ? "stop-circle" : "play"}
                    disabled={disabled}
                    type="submit"
                    title={title}
                >
                    {title}
                </vscode-button>
                <ModelOptionsFormHelper />
            </vscode-form-group>
            <RunButtonOptions />
        </>
    )
}

function ScriptView() {
    return (
        <Suspense>
            <RunForm />
            <ConfigurationTabPanel />
        </Suspense>
    )
}

function RunForm() {
    const { run, cancel, state } = useRunner()
    const action = state === "running" ? cancel : run
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        action()
    }
    useSyncProjectScript()

    return (
        <form onSubmit={handleSubmit}>
            <ScriptForm />
        </form>
    )
}

function ResultsView() {
    const [showRuns, setShowRuns] = useState(false)
    const handleShowRuns = () => setShowRuns((prev) => !prev)
    return (
        <vscode-collapsible className="collapsible" open title="Result">
            <ActionButton
                name="history"
                label={showRuns ? "Show previous runs" : "Hide previous runs"}
                onClick={handleShowRuns}
            />
            {showRuns && (
                <Suspense>
                    <RunResultSelector />
                </Suspense>
            )}
            <Suspense>
                <ResultsTabs />
            </Suspense>
        </vscode-collapsible>
    )
}

function ResultsTabs() {
    const [selected, setSelected] = useState(0)
    return (
        <>
            <vscode-tabs
                onvsc-tabs-select={(e: VscTabsSelectEvent) =>
                    setSelected(e.detail.selectedIndex)
                }
                panel
            >
                <OutputTabPanel selected={selected === 0} />
                <TraceTabPanel selected={selected === 1} />
                <MessagesTabPanel />
                <ProblemsTabPanel />
                <FileEditsTabPanel />
                <JSONTabPanel />
                <StatsTabPanel />
                <ErrorTabPanel />
                {diagnostics ? <RawTabPanel /> : undefined}
            </vscode-tabs>
        </>
    )
}

function WebApp() {
    switch (viewMode) {
        case "results":
            return (
                <Suspense>
                    <ResultsTabs />
                </Suspense>
            )
        default:
            return (
                <div style={{ minHeight: "100vh" }}>
                    {!hosted ? <ProjectView /> : null}
                    <ScriptView />
                    <ResultsView />
                </div>
            )
    }
}

export default function App() {
    return (
        <RunClientProvider>
            <ApiProvider>
                <RunnerProvider>
                    <Suspense>
                        <WebApp />
                    </Suspense>
                </RunnerProvider>
            </ApiProvider>
        </RunClientProvider>
    )
}
