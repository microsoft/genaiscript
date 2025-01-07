/// <reference path="../../core/src/types/prompt_template.d.ts" />
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
    useState,
} from "react"
import {
    VscodeButton,
    VscodeSingleSelect,
    VscodeOption,
    VscodeTextfield,
    VscodeCheckbox,
    VscodeFormContainer,
    VscodeFormGroup,
    VscodeFormHelper,
    VscodeLabel,
    VscodeProgressRing,
    VscodeCollapsible,
    VscodeTabs,
    VscodeTabHeader,
    VscodeTabPanel,
    VscodeBadge,
    VscodeTextarea,
    VscodeTree,
    VscodeSplitLayout,
    VscodeMultiSelect,
} from "@vscode-elements/react-elements"
import Markdown from "./Markdown"
import type {
    Project,
    PromptScriptListResponse,
    PromptScriptResponseEvents,
    PromptScriptStart,
    GenerationResult,
    ResolvedLanguageModelConfiguration,
    ServerEnvResponse,
} from "../../core/src/server/messages"
import { promptParametersSchemaToJSONSchema } from "../../core/src/parameters"
import {
    logprobToMarkdown,
    topLogprobsToMarkdown,
} from "../../core/src/logprob"
import { TreeItem } from "@vscode-elements/elements/dist/vscode-tree/vscode-tree"
import { FileWithPath, useDropzone } from "react-dropzone"
import prettyBytes from "pretty-bytes"
import { renderMessagesToMarkdown } from "../../core/src/chatrender"
import { stringify as YAMLStringify } from "yaml"
import { fenceMD } from "../../core/src/mkmd"
import { isBinaryMimeType } from "../../core/src/binary"
import { toBase64 } from "../../core/src/base64"

const urlParams = new URLSearchParams(window.location.hash)
const apiKey = urlParams.get("api-key")
window.location.hash = ""

const fetchScripts = async (): Promise<Project> => {
    const res = await fetch(`/api/scripts`, {
        headers: {
            Accept: "application/json",
            Authorization: apiKey || "",
        },
    })
    const j: PromptScriptListResponse = await res.json()
    return j.project
}
const fetchEnv = async (): Promise<ResolvedLanguageModelConfiguration[]> => {
    const res = await fetch(`/api/env`, {
        headers: {
            Accept: "application/json",
            Authorization: apiKey || "",
        },
    })
    const j: ServerEnvResponse = await res.json()
    return j.providers
}

type TraceEvent = CustomEvent<{ trace: string }>

class RunClient extends EventTarget {
    ws?: WebSocket
    runId: string
    result: GenerationResult | undefined

    static readonly TRACE_EVENT = "trace"
    static readonly RESULT_EVENT = "result"

    constructor(
        readonly script: string,
        readonly files: string[],
        readonly workspaceFiles: WorkspaceFile[],
        readonly options: any
    ) {
        super()
        this.runId = "" + Math.random()
        this.ws = new WebSocket(`/?api-key=${apiKey}`)
        this.ws.addEventListener(
            "open",
            () => {
                const id = "" + Math.random()

                this.ws?.send(
                    JSON.stringify({
                        id,
                        type: "script.start",
                        runId: this.runId,
                        script,
                        files: this.files,
                        options: {
                            ...(this.options || {}),
                            workspaceFiles: this.workspaceFiles,
                        },
                    } satisfies PromptScriptStart)
                )
            },
            false
        )
        this.ws.addEventListener("message", (ev) => {
            const data: PromptScriptResponseEvents = JSON.parse(ev.data)
            switch (data.type) {
                case "script.progress": {
                    if (data.trace)
                        this.dispatchEvent(
                            new CustomEvent(RunClient.TRACE_EVENT, {
                                detail: data,
                            })
                        )
                    break
                }
                case "script.end": {
                    this.result = data.result
                    this.dispatchEvent(
                        new CustomEvent(RunClient.RESULT_EVENT, {
                            detail: data,
                        })
                    )
                    break
                }
            }
        })
        this.ws.addEventListener("error", (err) => {
            console.log(`run ${this.runId}: error`)
            console.error(err)
        })
        this.ws.addEventListener("close", (ev) => {
            console.log(`run ${this.runId}: close, ${ev.reason}`)
        })
    }

    close() {
        console.trace(`client: close`)
        const ws = this.ws
        if (ws) {
            this.ws = undefined
            ws.send(
                JSON.stringify({
                    id: "" + Math.random(),
                    type: "script.abort",
                    runId: this.runId,
                })
            )
            ws.close()
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
        const params = new URLSearchParams()
        for (const key in state) {
            const field = fields[key]
            if (!field) continue

            const { type } = field
            const value = state[key]
            if (value === undefined || value === null) continue
            if (type === "string") params.set(key, value as string)
            else if (type === "boolean") {
                if (!!value) params.set(key, "1")
            } else if (type === "integer" || type === "number") {
                const v = value as number
                if (!isNaN(v)) params.set(key, v.toString())
            } else if (type === "array") {
                const v = (value as string[]).filter((s) => s !== "")
                if (v.length) params.set(key, v.join(","))
            }
        }
        window.history.pushState({}, "", `?${params.toString()}`)
    }, [state])
    return [state, setState] as const
}

const ApiContext = createContext<{
    project: Promise<Project | undefined>
    providers: Promise<ResolvedLanguageModelConfiguration[] | undefined>

    scriptid: string | undefined
    setScriptid: (id: string) => void
    files: string[]
    setFiles: (files: string[]) => void
    importedFiles: FileWithPath[]
    setImportedFiles: (files: FileWithPath[]) => void
    parameters: PromptParameters
    setParameters: (parameters: PromptParameters) => void
    options: ModelOptions
    setOptions: (
        f: (prev: ModelConnectionOptions) => ModelConnectionOptions
    ) => void
} | null>(null)

function ApiProvider({ children }: { children: React.ReactNode }) {
    const project = useMemo<Promise<Project>>(fetchScripts, [])
    const providers = useMemo<Promise<ResolvedLanguageModelConfiguration[]>>(
        fetchEnv,
        []
    )

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
            provider: { type: "string" },
            model: { type: "string" },
            smallModel: { type: "string" },
            visionModel: { type: "string" },
            temperature: { type: "number" },
            logprobs: { type: "boolean" },
            topLogprobs: { type: "integer" },
        }
    )
    const [importedFiles, setImportedFiles] = useState<FileWithPath[]>([])
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

    return (
        <ApiContext.Provider
            value={{
                project,
                providers,
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

const RunnerContext = createContext<{
    runner: RunClient | undefined
    run: () => void
    cancel: () => void
    state: "running" | undefined
} | null>(null)

function RunnerProvider({ children }: { children: React.ReactNode }) {
    const {
        scriptid,
        files = [],
        importedFiles = [],
        options,
        parameters,
    } = useApi()
    const [runner, setRunner] = useState<RunClient | undefined>(undefined)

    useEffect(() => {
        runner?.close()
        setRunner(undefined)
    }, [scriptid])

    const run = async () => {
        runner?.close()
        if (!scriptid) return

        console.log(`run: start ${scriptid}`, {
            files,
            importedFiles,
            parameters,
            options,
        })
        const workspaceFiles = await Promise.all(
            importedFiles.map(async (f) => {
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
                } satisfies WorkspaceFile
            })
        )
        const client = new RunClient(scriptid, files.slice(0), workspaceFiles, {
            parameters,
            ...options,
        })
        client.addEventListener(RunClient.RESULT_EVENT, () =>
            setRunner(undefined)
        )
        setRunner(client)
    }
    const cancel = () => {
        runner?.close()
        setRunner(undefined)
    }

    const state = runner ? "running" : undefined

    return (
        <RunnerContext.Provider
            value={{
                runner,
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

function useResult() {
    const { runner } = useRunner()
    const [result, setResult] = useState<GenerationResult | undefined>(
        undefined
    )
    useEffect(() => runner && setResult(undefined), [runner])
    const storeResult = useCallback(() => setResult(runner?.result), [runner])
    useEventListener(runner, RunClient.RESULT_EVENT, storeResult)
    return result
}

function useScripts() {
    const api = useApi()
    const project = use(api.project)
    const scripts = (project?.scripts?.filter((s) => !s.isSystem) || []).sort(
        (l, r) => l.id.localeCompare(r.id)
    )
    return scripts
}

function useScript() {
    const scripts = useScripts()
    const { scriptid } = useApi()
    return scripts.find((s) => s.id === scriptid)
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
        <VscodeTextfield
            value={valueText}
            required={required}
            placeholder={schema.default + ""}
            min={minimum}
            max={maximum}
            inputMode={type === "number" ? "decimal" : "numeric"}
            onChange={(e) => {
                const target = e.target as HTMLInputElement
                startTransition(() => setValueText(target.value))
            }}
        />
    )
}

function JSONSchemaSimpleTypeFormField(props: {
    field: JSONSchemaSimpleType
    value: string | boolean | number | object
    onChange: (value: string | boolean | number | object) => void
}) {
    const { field, value, onChange } = props
    const required = field.default === undefined

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
                    <VscodeSingleSelect
                        value={vs}
                        required={required}
                        onChange={(e) => {
                            const target = e.target as HTMLSelectElement
                            onChange(target.value)
                        }}
                    >
                        {field.enum.map((option) => (
                            <VscodeOption key={option} value={option}>
                                {option}
                            </VscodeOption>
                        ))}
                    </VscodeSingleSelect>
                )
            }
            return (
                <VscodeTextarea
                    style={{ height: "unset" }}
                    value={vs}
                    required={required}
                    rows={rows(vs)}
                    spellCheck={false}
                    placeholder={field.default}
                    onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement
                        target.rows = rows(target.value)
                    }}
                    onChange={(e) => {
                        const target = e.target as HTMLInputElement
                        onChange(target.value)
                    }}
                />
            )
        }
        case "boolean":
            return (
                <VscodeCheckbox
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
                <VscodeTextfield
                    spellCheck={false}
                    value={value as string}
                    required={required}
                    onChange={(e) => {
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
}) {
    const { schema, value, onChange } = props
    const properties: Record<string, JSONSchemaSimpleType> =
        schema.properties ?? ({} as any)

    const handleFieldChange = (fieldName: string, value: any) => {
        onChange((prev: any) => ({
            ...prev,
            [fieldName]: value,
        }))
    }

    return (
        <VscodeFormContainer>
            {Object.entries(properties).map(([fieldName, field]) => (
                <VscodeFormGroup key={fieldName}>
                    <VscodeLabel>{fieldName}</VscodeLabel>
                    <JSONSchemaSimpleTypeFormField
                        field={field}
                        value={value[fieldName]}
                        onChange={(value) =>
                            handleFieldChange(fieldName, value)
                        }
                    />
                    {field?.description && (
                        <VscodeFormHelper>{field.description}</VscodeFormHelper>
                    )}
                </VscodeFormGroup>
            ))}
        </VscodeFormContainer>
    )
}

function CounterBadge(props: { collection: any | undefined }) {
    const { collection } = props
    let count: string | undefined = undefined
    if (Array.isArray(collection)) {
        if (collection.length > 0) count = "" + collection.length
    } else if (collection) count = "1"

    return count ? (
        <VscodeBadge variant="counter" slot="content-after">
            {count}
        </VscodeBadge>
    ) : (
        ""
    )
}

function TraceTabPanel() {
    const { runner } = useRunner()
    const [trace, setTrace] = useState<string>("Run script to see trace.")
    useEffect(() => runner && setTrace(""), [runner])
    const appendTrace = useCallback(
        (evt: Event) =>
            startTransition(() => {
                setTrace(
                    (previous) => previous + (evt as TraceEvent).detail.trace
                )
            }),
        [runner]
    )
    useEventListener(runner, RunClient.TRACE_EVENT, appendTrace)
    return (
        <>
            <VscodeTabHeader slot="header">Trace</VscodeTabHeader>
            <VscodeTabPanel>
                <Markdown>{trace}</Markdown>
            </VscodeTabPanel>
        </>
    )
}

function ProblemsTabPanel() {
    const result = useResult()
    const { annotations = [] } = result || {}

    const renderAnnotation = (annotation: Diagnostic) => {
        const { message, severity } = annotation
        return `> [!${severity}]
> ${message.split("\n").join("\n> ")}
`
    }

    const annotationsMarkdown = annotations.map(renderAnnotation).join("\n")

    return (
        <>
            <VscodeTabHeader slot="header">
                Problems
                <CounterBadge collection={annotations} />
            </VscodeTabHeader>
            <VscodeTabPanel>
                <Markdown>{annotationsMarkdown}</Markdown>
            </VscodeTabPanel>
        </>
    )
}

function MessagesTabPanel() {
    const result = useResult()
    const { messages = [] } = result || {}
    const md = renderMessagesToMarkdown(messages, {
        system: true,
        user: true,
        assistant: true,
    })
    return (
        <>
            <VscodeTabHeader slot="header">
                Chat
                <CounterBadge collection={messages} />
            </VscodeTabHeader>
            <VscodeTabPanel>
                <Markdown>{md}</Markdown>
            </VscodeTabPanel>
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

function StatsTabPanel() {
    const result = useResult()
    const { stats } = result || {}
    const { cost, ...rest } = stats || {}

    const md = stats ? YAMLStringify(rest) : ""
    return (
        <>
            <VscodeTabHeader slot="header">
                Stats
                {!!cost && (
                    <VscodeBadge variant="counter" slot="content-after">
                        {renderCost(cost)}
                    </VscodeBadge>
                )}
            </VscodeTabHeader>
            <VscodeTabPanel>
                <Markdown>{fenceMD(md, "yaml")}</Markdown>
            </VscodeTabPanel>
        </>
    )
}

function OutputTabPanel() {
    const result = useResult()
    const { text, logprobs } = result || {}
    let md = text || ""
    if (logprobs?.length) {
        if (logprobs[0].topLogprobs?.length)
            md = logprobs.map((lp) => topLogprobsToMarkdown(lp)).join("\n")
        else md = logprobs.map((lp) => logprobToMarkdown(lp)).join("\n")
    }
    return (
        <>
            <VscodeTabHeader slot="header">
                Output
                <CounterBadge collection={text} />
            </VscodeTabHeader>
            <VscodeTabPanel>
                <Markdown>{md}</Markdown>
            </VscodeTabPanel>
        </>
    )
}

function LogProbsTabPanel() {
    const result = useResult()
    const { options } = useApi()
    const { logprobs } = result || {}
    if (!options.logprobs) return null
    const md = logprobs?.map((lp) => logprobToMarkdown(lp)).join("\n")
    return (
        <>
            <VscodeTabHeader slot="header">
                Perplexity
                <CounterBadge collection={md} />
            </VscodeTabHeader>
            <VscodeTabPanel>
                <Markdown>{md}</Markdown>
            </VscodeTabPanel>
        </>
    )
}

function TopLogProbsTabPanel() {
    const result = useResult()
    const { options } = useApi()
    const { logprobs } = result || {}
    if (!options.logprobs || !(options.topLogprobs > 1)) return null
    const md = logprobs?.map((lp) => topLogprobsToMarkdown(lp)).join("\n")
    return (
        <>
            <VscodeTabHeader slot="header">
                Entropy
                <CounterBadge collection={md} />
            </VscodeTabHeader>
            <VscodeTabPanel>
                <Markdown>{md}</Markdown>
            </VscodeTabPanel>
        </>
    )
}

function FilesTabPanel() {
    const result = useResult()
    const { fileEdits = {} } = result || {}
    const [selected, setSelected] = useState<string | undefined>(undefined)
    const files = Object.entries(fileEdits)
    const data: TreeItem[] = files.map(([file, edits]) => ({
        label: file,
        value: file,
        icons: true,
    }))
    const selectedFile = fileEdits[selected]

    return (
        <>
            <VscodeTabHeader slot="header">
                Files
                <CounterBadge collection={files} />
            </VscodeTabHeader>
            <VscodeTabPanel>
                {files.length > 0 && (
                    <VscodeSplitLayout split="vertical">
                        <div slot="start">
                            <VscodeTree
                                indentGuides
                                arrows
                                onVscTreeSelect={(e) => {
                                    setSelected(e.detail.value)
                                }}
                                data={data}
                            />
                        </div>
                        <div slot="end">
                            {selectedFile && (
                                <pre>{selectedFile?.after || ""}</pre>
                            )}
                        </div>
                    </VscodeSplitLayout>
                )}
            </VscodeTabPanel>
        </>
    )
}

function DataTabPanel() {
    const result = useResult()
    const { frames = [] } = result || {}

    return (
        <>
            <VscodeTabHeader slot="header">
                Data
                <CounterBadge collection={frames} />
            </VscodeTabHeader>
            <VscodeTabPanel>
                {frames.map((frame, i) => (
                    <Markdown key={i}>
                        {`
\`\`\`\`\`json
${JSON.stringify(frame, null, 2)}}
\`\`\`\`\`
`}
                    </Markdown>
                ))}
            </VscodeTabPanel>
        </>
    )
}

function JSONTabPanel() {
    const result = useResult()
    const { json } = result || {}
    return (
        <>
            <VscodeTabHeader slot="header">
                JSON
                <CounterBadge collection={json} />
            </VscodeTabHeader>
            <VscodeTabPanel>
                {json && (
                    <Markdown>
                        {`
\`\`\`\`\`json
${JSON.stringify(json, null, 2)}}
\`\`\`\`\`
`}
                    </Markdown>
                )}
            </VscodeTabPanel>
        </>
    )
}

function RawTabPanel() {
    const result = useResult()
    return (
        <>
            <VscodeTabHeader slot="header">Raw</VscodeTabHeader>
            <VscodeTabPanel>
                {result && (
                    <Markdown>
                        {`
\`\`\`\`\`json
${JSON.stringify(result, null, 2)}}
\`\`\`\`\`
`}
                    </Markdown>
                )}
            </VscodeTabPanel>
        </>
    )
}

function toStringList(...token: (string | undefined | null)[]) {
    const md = token
        .filter((l) => l !== undefined && l !== null && l !== "")
        .join(", ")
    return md
}

function FilesDropZone() {
    const { acceptedFiles, isDragActive, getRootProps, getInputProps } =
        useDropzone()
    const { setImportedFiles } = useApi()

    useEffect(() => setImportedFiles(acceptedFiles.slice()), [acceptedFiles])

    return (
        <>
            <VscodeFormGroup>
                <VscodeLabel>Files</VscodeLabel>
                <VscodeMultiSelect
                    onChange={(e) => {
                        e.preventDefault()
                        const target = e.target as HTMLSelectElement
                        const value = target.value as string
                        setImportedFiles(
                            acceptedFiles.filter((f) => f.path === value)
                        )
                    }}
                >
                    {acceptedFiles.map((file) => (
                        <VscodeOption
                            key={file.path}
                            value={file.path}
                            selected
                        >
                            {file.name} ({prettyBytes(file.size)})
                        </VscodeOption>
                    ))}
                </VscodeMultiSelect>
            </VscodeFormGroup>
            <VscodeFormGroup
                style={{
                    cursor: "pointer",
                }}
                {...getRootProps({ className: "dropzone" })}
            >
                <input {...getInputProps()} />
                <VscodeFormHelper>
                    {isDragActive
                        ? `Drop the files here ...`
                        : `Drag 'n' drop some files here, or click to select files`}
                </VscodeFormHelper>
            </VscodeFormGroup>
        </>
    )
}

function GlobsForm() {
    const { files = [], setFiles } = useApi()
    return (
        <VscodeFormContainer>
            <VscodeFormGroup>
                <VscodeLabel>Globs</VscodeLabel>
                <VscodeTextarea
                    value={files.join(", ")}
                    label="List of files glob patterns, one per line"
                    onChange={(e) => {
                        const target = e.target as HTMLInputElement
                        startTransition(() => setFiles(target.value.split(",")))
                    }}
                />
            </VscodeFormGroup>
        </VscodeFormContainer>
    )
}

function ScriptSelect() {
    const scripts = useScripts()
    const { scriptid, setScriptid } = useApi()
    const script = useScript()

    return (
        <VscodeFormGroup>
            <VscodeLabel style={{ padding: 0 }}>
                <GenAIScriptLogo height="2em" />
            </VscodeLabel>
            <VscodeSingleSelect
                value={scriptid}
                required={true}
                combobox
                filter="fuzzy"
                onChange={(e) => {
                    const target = e.target as HTMLSelectElement
                    setScriptid(target.value)
                }}
            >
                {scripts
                    .filter((s) => !s.isSystem && !s.unlisted)
                    .map(({ id, title }) => (
                        <VscodeOption
                            value={id}
                            selected={scriptid === id}
                            description={title}
                        >
                            {id}
                        </VscodeOption>
                    ))}
            </VscodeSingleSelect>
            {script && (
                <VscodeFormHelper>
                    {toStringList(script.title, script.description)}
                </VscodeFormHelper>
            )}
        </VscodeFormGroup>
    )
}

function ScriptForm() {
    return (
        <VscodeCollapsible open title="Script">
            <VscodeFormContainer>
                <ScriptSelect />
                <FilesDropZone />
                <PromptParametersFields />
                <RunButton />
            </VscodeFormContainer>
        </VscodeCollapsible>
    )
}

function ScriptSourcesView() {
    const script = useScript()
    const { jsSource, text } = script || {}
    return (
        <VscodeCollapsible title="Source">
            {text ? (
                <Markdown>{`\`\`\`\`\`\`
${text.trim()}
\`\`\`\`\`\``}</Markdown>
            ) : null}
            {jsSource ? (
                <Markdown>
                    {`\`\`\`\`\`\`js
${jsSource.trim()}
\`\`\`\`\`\``}
                </Markdown>
            ) : null}
        </VscodeCollapsible>
    )
}

function PromptParametersFields() {
    const script = useScript()

    const { parameters, setParameters } = useApi()
    const schema = useMemo(
        () =>
            script?.parameters
                ? (promptParametersSchemaToJSONSchema(
                      script.parameters
                  ) as JSONSchemaObject)
                : undefined,
        [script]
    )
    const names = Object.keys(schema?.properties || {})
    return schema ? (
        <JSONSchemaObjectForm
            schema={schema}
            value={parameters}
            onChange={setParameters}
        />
    ) : null
}

function ModelConnectionOptionsForm() {
    const { options, setOptions, providers: providersPromise } = useApi()
    const providers = use(providersPromise)

    const schema: JSONSchemaObject = {
        type: "object",
        properties: {
            cache: {
                type: "boolean",
                description: `Enable cache for LLM requests`,
                default: false,
            },
            provider: {
                type: "string",
                description: "LLM provider",
                enum: providers
                    .filter((p) => !p.error)
                    .sort((l, r) => l.provider.localeCompare(r.provider))
                    .map((p) => p.provider),
                default: "openai",
            },
            model: {
                type: "string",
                description: "large model id",
                default: "large",
            },
            smallModel: {
                type: "string",
                description: "small model id",
                default: "small",
            },
            visionModel: {
                type: "string",
                description: "vision model id",
                default: "vision",
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
        <VscodeCollapsible title="Model Options">
            <JSONSchemaObjectForm
                schema={schema}
                value={options}
                onChange={setOptions}
            />
        </VscodeCollapsible>
    )
}

function RunButton() {
    const { scriptid, options } = useApi()
    const { state } = useRunner()
    const disabled = !scriptid

    return (
        <VscodeFormGroup>
            <VscodeLabel></VscodeLabel>
            <VscodeButton disabled={disabled} type="submit">
                {state === "running" ? "Running..." : "Run"}
            </VscodeButton>
            <VscodeFormHelper>
                {Object.entries(options)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(", ")}
            </VscodeFormHelper>
        </VscodeFormGroup>
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
            <ScriptSourcesView />
            <ModelConnectionOptionsForm />
        </form>
    )
}

function WebApp() {
    return (
        <>
            <RunForm />
            <VscodeCollapsible open title="Results">
                <VscodeTabs panel>
                    <TraceTabPanel />
                    <ProblemsTabPanel />
                    <MessagesTabPanel />
                    <OutputTabPanel />
                    <StatsTabPanel />
                    <LogProbsTabPanel />
                    <TopLogProbsTabPanel />
                    <FilesTabPanel />
                    <JSONTabPanel />
                    <RawTabPanel />
                </VscodeTabs>
            </VscodeCollapsible>
        </>
    )
}

export default function App() {
    return (
        <ApiProvider>
            <RunnerProvider>
                <Suspense fallback={<VscodeProgressRing />}>
                    <WebApp />
                </Suspense>
            </RunnerProvider>
        </ApiProvider>
    )
}
