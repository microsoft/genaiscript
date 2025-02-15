/// <reference path="../../core/src/types/prompt_template.d.ts" />
/// <reference path="./vscode-elements.d.ts" />
import React, {
    createContext,
    Dispatch,
    SetStateAction,
    startTransition,
    Suspense,
    use,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react"
import { throttle } from "es-toolkit"

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
import type {
    Project,
    PromptScriptListResponse,
    PromptScriptResponseEvents,
    GenerationResult,
    ServerEnvResponse,
    RequestMessages,
    PromptScriptStartResponse,
    PromptScriptEndResponseEvent,
    LogMessageEvent,
} from "../../core/src/server/messages"
import { logprobColor, renderLogprob, rgbToCss } from "../../core/src/logprob"
import { FileWithPath, useDropzone } from "react-dropzone"
import prettyBytes from "pretty-bytes"
import { renderMessagesToMarkdown } from "../../core/src/chatrender"
import { stringify as YAMLStringify } from "yaml"
import { fenceMD } from "../../core/src/mkmd"
import { isBinaryMimeType } from "../../core/src/binary"
import { toBase64 } from "../../core/src/base64"
import { underscore } from "inflection"
import { lookupMime } from "../../core/src/mime"
import dedent from "dedent"
import { markdownDiff } from "../../core/src/mddiff"
import { cleanedClone } from "../../core/src/clone"
import { WebSocketClient } from "../../core/src/server/wsclient"
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
import {
    MODEL_PROVIDER_GITHUB_COPILOT_CHAT,
    MESSAGE,
    QUEUE_SCRIPT_START,
    CHANGE,
} from "../../core/src/constants"
import {
    DetailsNode,
    parseTraceTree,
    renderTraceTree,
    TraceNode,
} from "../../core/src/traceparser"
import { unmarkdown } from "../../core/src/cleaners"

interface GenAIScriptViewOptions {
    apiKey?: string
    base?: string
}
interface GenAIScriptHost {
    genaiscript?: GenAIScriptViewOptions
}

const urlParams = new URLSearchParams(window.location.search)
const config = (self as GenAIScriptHost).genaiscript
delete (self as GenAIScriptHost).genaiscript
const hosted = !!config
const viewMode = (hosted ? "results" : urlParams.get("view")) as
    | "results"
    | undefined
const diagnostics = urlParams.get("dbg") === "1"
const hashParams = new URLSearchParams(window.location.hash.slice(1))
const base = config?.base || ""
const apiKeyName = "genaiscript.apikey"
const apiKey =
    hashParams.get("api-key") ||
    config?.apiKey ||
    localStorage.getItem(apiKeyName) ||
    ""
window.location.hash = ""
if (hashParams.get("api-key"))
    localStorage.setItem(apiKeyName, hashParams.get("api-key"))
if (!hosted) import("@vscode-elements/webview-playground")

const fetchScripts = async (): Promise<Project> => {
    const res = await fetch(`${base}/api/scripts`, {
        headers: {
            Accept: "application/json",
            Authorization: apiKey,
        },
    })
    if (!res.ok) throw new Error(await res.json())

    const j: PromptScriptListResponse = await res.json()
    return j.project
}
const fetchEnv = async (): Promise<ServerEnvResponse> => {
    const res = await fetch(`${base}/api/env`, {
        headers: {
            Accept: "application/json",
            Authorization: apiKey,
        },
    })
    if (!res.ok) throw new Error(await res.json())

    const j: ServerEnvResponse = await res.json()
    return j
}
const fetchRun = async (
    runId: string
): Promise<PromptScriptEndResponseEvent> => {
    const res = await fetch(`${base}/api/runs/${runId}`, {
        headers: {
            Accept: "application/json",
            Authorization: apiKey,
        },
    })
    if (!res.ok) throw new Error(await res.json())

    const j: PromptScriptEndResponseEvent = await res.json()
    return j
}

class RunClient extends WebSocketClient {
    static readonly SCRIPT_START_EVENT = "scriptStart"
    static readonly SCRIPT_END_EVENT = "scriptEnd"
    static readonly PROGRESS_EVENT = "progress"
    static readonly RUN_EVENT = "run"
    static readonly RESULT_EVENT = "result"

    runId: string
    trace: string = ""
    output: string = ""
    reasoning: string = ""
    result: Partial<GenerationResult> = undefined

    private progressEventThrottled = throttle(
        this.dispatchProgressEvent.bind(this),
        2000,
        {
            edges: ["leading"],
        }
    )

    private stderr = ""
    constructor(url: string) {
        super(url)
        this.addEventListener(QUEUE_SCRIPT_START, () => {
            this.updateRunId({ runId: "" })
        })
        this.stderr = ""
        this.addEventListener(
            MESSAGE,
            async (ev) => {
                const data = (ev as MessageEvent<any>).data as
                    | PromptScriptResponseEvents
                    | RequestMessages
                    | LogMessageEvent
                switch (data.type) {
                    case "log": {
                        const fn = console[data.level]
                        fn?.(data.message)
                        break
                    }
                    case "script.progress": {
                        this.updateRunId(data)
                        if (data.trace) this.trace += data.trace
                        if (data.output && !data.inner) {
                            this.output += data.output
                        }
                        if (data.reasoning) this.reasoning += data.reasoning
                        if (data.responseChunk) {
                            this.stderr += data.responseChunk
                            const lines = this.stderr.split("\n")
                            for (const line of lines.slice(0, lines.length - 1))
                                console.debug(line)
                            this.stderr = lines.at(-1)
                        }
                        this.progressEventThrottled()
                        break
                    }
                    case "script.end": {
                        this.updateRunId(data)
                        if (data.result) {
                            this.result = cleanedClone(data.result)
                        } else {
                            const e = await fetchRun(data.runId)
                            this.result = cleanedClone(e.result)
                            this.trace = e.trace || ""
                        }
                        this.output = this.result?.text || ""
                        this.reasoning = this.result?.reasoning || ""
                        this.dispatchEvent(
                            new CustomEvent(RunClient.SCRIPT_END_EVENT, {
                                detail: this.result,
                            })
                        )
                        this.dispatchEvent(new Event(RunClient.RESULT_EVENT))
                        this.dispatchProgressEvent()
                        break
                    }
                    case "script.start":
                        this.updateRunId(
                            data.response as PromptScriptStartResponse
                        )
                        this.dispatchEvent(
                            new CustomEvent(RunClient.SCRIPT_START_EVENT, {
                                detail: data.response,
                            })
                        )
                        break
                    default: {
                        console.log(data)
                    }
                }
            },
            false
        )
    }

    private dispatchProgressEvent() {
        this.dispatchEvent(new Event(RunClient.PROGRESS_EVENT))
    }

    private updateRunId(data: { runId: string }) {
        const { runId } = data
        if (runId !== this.runId) {
            this.runId = runId
            if (this.runId) {
                this.trace = ""
                this.output = ""
                this.result = undefined
                this.stderr = ""
                this.dispatchEvent(new Event(RunClient.RESULT_EVENT))
            }
            this.dispatchEvent(new Event(RunClient.RUN_EVENT))
        }
    }
}

function useUrlSearchParams<T>(
    initialValues: T,
    fields: Record<
        string,
        | JSONSchemaString
        | JSONSchemaNumber
        | JSONSchemaBoolean
        | JSONSchemaArray
    >
) {
    const [state, setState] = useState<T>(initialValues)
    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const newState: any = {}
        Object.entries(fields).forEach(([key, field]) => {
            const { type } = field
            const value = params.get(key)
            if (value !== undefined && value !== null) {
                if (type === "string") {
                    if (value !== "") newState[key] = value
                } else if (type === "boolean")
                    newState[key] =
                        value === "1" || value === "yes" || value === "true"
                else if (type === "integer" || type === "number") {
                    const parsed =
                        type === "number" ? parseFloat(value) : parseInt(value)
                    if (!isNaN(parsed)) newState[key] = parsed
                } else if (type === "array") {
                    const parsed = value.split(",").filter((s) => s !== "")
                    if (parsed.length > 0) newState[key] = parsed
                }
            }
        })
        setState(newState)
    }, [])
    useEffect(() => {
        const params = new URLSearchParams(urlParams)
        for (const key in state) {
            const field = fields[key]
            if (!field) continue

            const { type } = field
            const value = state[key]
            if (value === undefined || value === null) continue
            if (type === "string") {
                if (value !== "") params.set(key, value as string)
            } else if (type === "boolean") {
                if (!!value) params.set(key, "1")
            } else if (type === "integer" || type === "number") {
                const v = value as number
                if (!isNaN(v)) params.set(key, v.toString())
            } else if (type === "array") {
                const v = (value as string[]).filter((s) => s !== "")
                if (v.length) params.set(key, v.join(","))
            }
        }

        let url = ""
        if (params.toString()) url += `?${params.toString()}`
        window.history.pushState({}, "", url)
    }, [state])
    return [state, setState] as const
}

type ImportedFile = FileWithPath & { selected?: boolean }

const ApiContext = createContext<{
    client: RunClient
    project: Promise<Project | undefined>
    env: Promise<ServerEnvResponse | undefined>

    scriptid: string | undefined
    setScriptid: (id: string) => void
    files: string[]
    setFiles: (files: string[]) => void
    importedFiles: ImportedFile[]
    setImportedFiles: (files: ImportedFile[]) => void
    parameters: PromptParameters
    setParameters: (parameters: PromptParameters) => void
    options: ModelOptions
    setOptions: (
        f: (prev: ModelConnectionOptions) => ModelConnectionOptions
    ) => void
    refresh: () => void
} | null>(null)

function ApiProvider({ children }: { children: React.ReactNode }) {
    const [refreshId, setRefreshId] = useState(0)
    const client = useMemo(() => {
        const client = new RunClient(
            `${base}/${apiKey ? `?api-key=${apiKey}` : ""}`
        )
        client.addEventListener("error", (err) => console.error(err), false)
        return client
    }, [])

    const project = useMemo<Promise<Project>>(fetchScripts, [refreshId])
    const env = useMemo<Promise<ServerEnvResponse>>(fetchEnv, [refreshId])

    const refresh = () => setRefreshId((prev) => prev + 1)

    const [state, setState] = useUrlSearchParams<
        {
            scriptid: string
            files: string[]
        } & ModelConnectionOptions
    >(
        {
            scriptid: "",
            files: [],
        },
        {
            scriptid: { type: "string" },
            files: { type: "array", items: { type: "string" } },
            cache: { type: "boolean" },
            provider: { type: "string" },
            model: { type: "string" },
            smallModel: { type: "string" },
            visionModel: { type: "string" },
            temperature: { type: "number" },
            logprobs: { type: "boolean" },
            topLogprobs: { type: "integer" },
        }
    )
    const [importedFiles, setImportedFiles] = useState<ImportedFile[]>([])
    const { scriptid, files, ...options } = state
    const [parameters, setParameters] = useState<PromptParameters>({})
    const setScriptid = (id: string) =>
        setState((prev) => ({ ...prev, scriptid: id }))
    const setFiles = (files: string[]) =>
        setState((prev) => ({
            ...prev,
            files: files.filter((s) => s !== "").slice(),
        }))
    const setOptions = (
        f: (prev: ModelConnectionOptions) => ModelConnectionOptions
    ) => {
        setState((prev) => ({ ...prev, ...f(options) }))
    }
    useEffect(() => {
        client.init()
    }, [])

    return (
        <ApiContext.Provider
            value={{
                client,
                project,
                env,
                scriptid,
                setScriptid,
                files,
                setFiles,
                importedFiles,
                setImportedFiles,
                parameters,
                setParameters,
                options,
                setOptions,
                refresh,
            }}
        >
            {children}
        </ApiContext.Provider>
    )
}

function useApi() {
    const api = use(ApiContext)
    if (!api) throw new Error("missing content")
    return api
}

function useEnv() {
    const { env: envPromise } = useApi()
    const env = use(envPromise)
    return env
}

function useProject() {
    const api = useApi()
    const project = use(api.project)
    return project
}

function useScripts() {
    const project = useProject()
    const scripts = (
        project?.scripts?.filter((s) => !s.isSystem && !s.unlisted) || []
    ).sort((l, r) => l.id.localeCompare(r.id))
    return scripts
}

function useScript() {
    const scripts = useScripts()
    const { scriptid } = useApi()

    return scripts.find((s) => s.id === scriptid)
}

function useSyncProjectScript() {
    const { scriptid, setScriptid } = useApi()
    const scripts = useScripts()
    useEffect(() => {
        if (!scriptid && scripts.length > 0) setScriptid(scripts[0].id)
        else if (scriptid && !scripts.find((s) => s.id === scriptid))
            setScriptid(scripts[0]?.id)
    }, [scripts, scriptid])
}

function useClientReadyState() {
    const { client } = useApi()
    const [state, setState] = useState(client?.readyState)
    useEffect(() => {
        if (!client) return undefined
        const update = () => startTransition(() => setState(client.readyState))
        client.addEventListener(CHANGE, update, false)
        return () => client.removeEventListener(CHANGE, update)
    }, [client])
    return state
}

const RunnerContext = createContext<{
    runId: string | undefined
    run: () => void
    cancel: () => void
    state: "running" | undefined
} | null>(null)

function RunnerProvider({ children }: { children: React.ReactNode }) {
    const {
        client,
        scriptid,
        files = [],
        importedFiles = [],
        options,
        parameters,
    } = useApi()

    const [runId, setRunId] = useState<string>(client.runId)

    const start = useCallback((e: Event) => {
        const ev = e as CustomEvent
        setRunId(ev.detail.runId)
    }, [])
    useEventListener(client, RunClient.SCRIPT_START_EVENT, start, false)

    const runUpdate = useCallback((e: Event) => setRunId(client.runId), [runId])
    useEventListener(client, RunClient.RUN_EVENT, runUpdate, false)

    const end = useCallback((e: Event) => {
        const ev = e as CustomEvent
        setRunId(undefined)
    }, [])
    useEventListener(client, RunClient.SCRIPT_END_EVENT, end, false)

    const run = async () => {
        if (!scriptid) return

        const runId = ("" + Math.random()).slice(2)
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
    }

    const state = runId ? "running" : undefined

    return (
        <RunnerContext.Provider
            value={{
                runId,
                run,
                cancel,
                state,
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
    const { client } = useApi()
    const [result, setResult] = useState(client.result)
    const update = useCallback(() => setResult(client.result), [client])
    useEventListener(client, RunClient.RESULT_EVENT, update)
    return result
}

function useEventListener(
    target: EventTarget | undefined,
    eventName: string,
    handler: EventListener,
    options?: boolean | AddEventListenerOptions
) {
    useEffect(() => {
        target?.addEventListener(eventName, handler, options)
        return () => target?.removeEventListener(eventName, handler, options)
    }, [target, eventName, handler, JSON.stringify(options)])
}

function useTrace() {
    const { client } = useApi()
    const [trace, setTrace] = useState(client.trace)
    const appendTrace = useCallback(
        (evt: Event) =>
            startTransition(() => setTrace((previous) => client.trace)),
        []
    )
    useEventListener(client, RunClient.PROGRESS_EVENT, appendTrace)
    return trace
}

function useOutput() {
    const { client } = useApi()
    const [value, setValue] = useState<string>(client.output)
    const appendTrace = useCallback(
        (evt: Event) =>
            startTransition(() => setValue((previous) => client.output)),
        []
    )
    useEventListener(client, RunClient.PROGRESS_EVENT, appendTrace)
    return value
}

function useReasoning() {
    const { client } = useApi()
    const [value, setValue] = useState<string>(client.reasoning)
    const appendTrace = useCallback(
        (evt: Event) =>
            startTransition(() => setValue((previous) => client.reasoning)),
        []
    )
    useEventListener(client, RunClient.PROGRESS_EVENT, appendTrace)
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

function JSONSchemaNumber(props: {
    schema: JSONSchemaNumber
    value: number
    onChange: (value: number) => void
}) {
    const { schema, value, onChange } = props
    const { type, minimum, maximum } = schema
    const required = schema.default === undefined
    const [valueText, setValueText] = useState(
        isNaN(value) ? "" : String(value)
    )

    useEffect(() => {
        const v =
            type === "number" ? parseFloat(valueText) : parseInt(valueText)
        if (!isNaN(v) && v !== value) onChange(v)
    }, [valueText])

    return (
        <vscode-textfield
            value={valueText}
            required={required}
            placeholder={schema.default + ""}
            min={minimum}
            max={maximum}
            inputMode={type === "number" ? "decimal" : "numeric"}
            onInput={(e) => {
                const target = e.target as HTMLInputElement
                startTransition(() => setValueText(target.value))
            }}
        />
    )
}

function JSONSchemaSimpleTypeFormField(props: {
    field: JSONSchemaSimpleType
    value: string | boolean | number | object
    required?: boolean
    onChange: (value: string | boolean | number | object) => void
}) {
    const { field, required, value, onChange } = props

    const rows = (s: string | undefined) =>
        Math.max(3, s.split("\n").length ?? 0)

    switch (field.type) {
        case "number":
        case "integer":
            return (
                <JSONSchemaNumber
                    schema={field}
                    value={Number(value)}
                    onChange={onChange}
                />
            )
        case "string": {
            const vs = (value as string) || ""
            if (field.enum) {
                return (
                    <vscode-single-select
                        value={vs}
                        required={required}
                        combobox
                        onvsc-change={(e: Event) => {
                            const target = e.target as HTMLSelectElement
                            onChange(target.value)
                        }}
                    >
                        <vscode-option key="empty" value=""></vscode-option>
                        {field.enum.map((option) => (
                            <vscode-option key={option} value={option}>
                                {option}
                            </vscode-option>
                        ))}
                    </vscode-single-select>
                )
            }
            if (field.uiType === "textarea")
                return (
                    <vscode-textarea
                        className="vscode-form-wide"
                        value={vs}
                        required={required}
                        rows={rows(vs)}
                        spellCheck={true}
                        placeholder={field.default}
                        onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement
                            target.rows = rows(target.value)
                            onChange(target.value)
                        }}
                    />
                )
            else
                return (
                    <vscode-textfield
                        value={vs}
                        required={required}
                        spellCheck={false}
                        placeholder={field.default}
                        onInput={(e) => {
                            const target = e.target as HTMLTextAreaElement
                            target.rows = rows(target.value)
                            onChange(target.value)
                        }}
                    />
                )
        }
        case "boolean":
            return (
                <vscode-checkbox
                    checked={value as boolean}
                    required={required}
                    onChange={(e) => {
                        const target = e.target as HTMLInputElement
                        onChange(target.checked)
                    }}
                />
            )
        default:
            return (
                <vscode-textfield
                    spellCheck={false}
                    value={value as string}
                    required={required}
                    onInput={(e) => {
                        const target = e.target as HTMLInputElement
                        onChange(target.value)
                    }}
                />
            )
    }
}

function JSONSchemaObjectForm(props: {
    schema: JSONSchemaObject
    value: any
    onChange: Dispatch<SetStateAction<any>>
    fieldPrefix: string
}) {
    const { schema, value, onChange, fieldPrefix } = props
    const properties: Record<string, JSONSchemaSimpleType> =
        schema.properties ?? ({} as any)

    const handleFieldChange = (fieldName: string, value: any) => {
        onChange((prev: any) => ({
            ...prev,
            [fieldName]: value,
        }))
    }

    return (
        <>
            {Object.entries(properties).map(([fieldName, field]) => (
                <vscode-form-group key={fieldPrefix + fieldName}>
                    <vscode-label>
                        {underscore(
                            (fieldPrefix ? `${fieldPrefix} / ` : fieldPrefix) +
                                (field.title || fieldName)
                        ).replaceAll(/[_\.]/g, " ")}
                    </vscode-label>
                    <JSONSchemaSimpleTypeFormField
                        field={field}
                        value={value[fieldPrefix + fieldName]}
                        required={schema.required?.includes(fieldName)}
                        onChange={(value) =>
                            handleFieldChange(fieldPrefix + fieldName, value)
                        }
                    />
                    {field?.description && (
                        <vscode-form-helper>
                            {field.description}
                        </vscode-form-helper>
                    )}
                </vscode-form-group>
            ))}
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
    const [node, setNode] = useState<TraceNode | undefined>(undefined)
    const openeds = useRef(new Set<string>())
    const tree = useMemo(() => {
        console.log(Array.from(openeds.current.values()).join(", "))
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
        return newData.subItems
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
    return (
        <vscode-scrollable>
            <vscode-split-layout
                initial-handle-position="20%"
                fixed-pane="start"
            >
                <div slot="start">
                    <vscode-tree
                        data={data}
                        ref={treeRef}
                        indentGuides={true}
                        onvsc-tree-select={handleSelect}
                    />
                </div>
                <div slot="end">
                    {preview ? <Markdown>{preview}</Markdown> : null}
                </div>
            </vscode-split-layout>
        </vscode-scrollable>
    )
}

function TraceTabPanel(props: { selected?: boolean }) {
    const { selected } = props
    const trace = useTrace()
    return (
        <>
            <vscode-tab-header slot="header">
                Trace
                <ErrorStatusBadge />
            </vscode-tab-header>
            <vscode-tab-panel>
                {selected ? <TraceTreeMarkdown /> : null}
            </vscode-tab-panel>
        </>
    )
}

function ReasoningTabPanel() {
    const reasoning = useReasoning()
    if (!reasoning) return null
    return (
        <>
            <vscode-tab-header slot="header">Reasoning</vscode-tab-header>
            <vscode-tab-panel>
                <MarkdownPreviewTabs text={reasoning} filename="reasoning.md" />
            </vscode-tab-panel>
        </>
    )
}

function OutputMarkdown() {
    const output = useOutput()
    if (!output) return null
    return (
        <vscode-scrollable>
            <vscode-tabs>
                <ReasoningTabPanel />
                <MarkdownPreviewTabs
                    aiDisclaimer={true}
                    filename="output.md"
                    text={output}
                />
                <LogProbsTabPanel />
                <EntropyTabPanel />
                <TopLogProbsTabPanel />
            </vscode-tabs>
        </vscode-scrollable>
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

function OutputTraceTabPanel(props: { selected?: boolean }) {
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

function MessagesTabPanel() {
    const result = useResult()
    const { messages = [] } = result || {}
    if (!messages.length) return null
    const md = renderMessagesToMarkdown(messages, {
        system: true,
        user: true,
        assistant: true,
    })
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
                <Markdown copySaveButtons={true}>{md}</Markdown>
            </vscode-tab-panel>
        </>
    )
}

function renderCost(value: number) {
    if (!value) return ""
    return value <= 0.01
        ? `${(value * 100).toFixed(3)}¢`
        : value <= 0.1
          ? `${(value * 100).toFixed(2)}¢`
          : `${value.toFixed(2)}$`
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
    const { cost, prompt_tokens, completion_tokens } = stats
    if (!cost && !completion_tokens) return null
    return (
        <>
            {[
                prompt_tokens ? `${prompt_tokens}↑` : undefined,
                completion_tokens ? `${completion_tokens}↓` : undefined,
                renderCost(cost),
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

function toStringList(...token: (string | undefined | null)[]) {
    const md = token
        .filter((l) => l !== undefined && l !== null && l !== "")
        .join(", ")
    return md
}

function acceptToAccept(accept: string | undefined) {
    if (!accept) return undefined
    const res: Record<string, string[]> = {}
    const extensions = accept.split(",")
    for (const ext of extensions) {
        const mime = lookupMime(ext)
        if (mime) {
            const exts = res[mime] || (res[mime] = [])
            if (!exts.includes(ext)) exts.push(ext)
        }
    }
    return res
}

function FilesDropZone() {
    const script = useScript()
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

function RemoteInfo() {
    const { remote } = useEnv() || {}
    if (!remote?.url) return null

    const { url, branch } = remote
    const value = `${url}#${branch}`
    return (
        <vscode-form-group>
            <vscode-label>Remote</vscode-label>
            <vscode-textfield readonly={true} disabled={true} value={value} />
            <vscode-form-helper>
                Running GenAIScript on a clone of this repository.
            </vscode-form-helper>
        </vscode-form-group>
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
                <Markdown className="no-margins">{description}</Markdown>
            ) : null}
        </vscode-form-helper>
    )
}

function RefreshButton() {
    const { refresh } = useApi()

    const handleClick = (e: React.UIEvent) => {
        e.preventDefault()
        refresh()
    }

    return (
        <vscode-icon
            tabIndex={0}
            name="refresh"
            action-icon
            label="refresh the scripts"
            onClick={handleClick}
            onKeyDown={handleClick}
            slot="actions"
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
    const script = useScript()
    return (
        <vscode-collapsible open title="Script">
            <RefreshButton />
            <RemoteInfo />
            <ScriptSelect />
            <FilesDropZone />
            <PromptParametersFields />
            <RunButton />
        </vscode-collapsible>
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
                <vscode-collapsible title="Parameters" open>
                    <JSONSchemaObjectForm
                        schema={scriptParameters}
                        value={parameters}
                        fieldPrefix={""}
                        onChange={setParameters}
                    />
                </vscode-collapsible>
            )}
            {!!systemParameters.length && (
                <vscode-collapsible title="System Parameters">
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
                enum: models,
            },
            smallModel: {
                type: "string",
                description: "'small' model identifier",
                default: "small",
                enum: models,
            },
            visionModel: {
                type: "string",
                description: "'vision' model identifier",
                default: "vision",
                enum: models,
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
        <vscode-collapsible title="Configuration">
            <vscode-tabs panel>
                <ModelConfigurationTabPanel />
                <ProviderConfigurationTabPanel />
            </vscode-tabs>
        </vscode-collapsible>
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

function RunButton() {
    const { scriptid, options } = useApi()
    const { state } = useRunner()
    const disabled = !scriptid

    const title = state === "running" ? "Abort" : "Run"
    return (
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
            <vscode-form-helper>
                {Object.entries(options)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(", ")}
            </vscode-form-helper>
        </vscode-form-group>
    )
}

function RunForm() {
    const { run, cancel, state } = useRunner()
    const action = state === "running" ? cancel : run
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        action()
    }

    return (
        <form onSubmit={handleSubmit}>
            <ScriptForm />
            <ConfigurationTabPanel />
        </form>
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
                <OutputTraceTabPanel selected={selected === 0} />
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
    useSyncProjectScript()
    switch (viewMode) {
        case "results":
            return <ResultsTabs />
        default:
            return (
                <>
                    <RunForm />
                    <vscode-collapsible open title="Results">
                        <ResultsTabs />
                    </vscode-collapsible>
                </>
            )
    }
}

export default function App() {
    return (
        <ApiProvider>
            <RunnerProvider>
                <Suspense>
                    <WebApp />
                </Suspense>
            </RunnerProvider>
        </ApiProvider>
    )
}
