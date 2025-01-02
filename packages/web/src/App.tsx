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
} from "@vscode-elements/react-elements"
import Markdown from "./Markdown"
import type {
    Project,
    PromptScriptListResponse,
    PromptScriptProgressResponseEvent,
    PromptScriptResponseEvents,
    PromptScriptStart,
    RequestMessage,
    GenerationResult,
} from "../../core/src/server/messages"
import {
    promptParametersSchemaToJSONSchema,
    promptParameterTypeToJSONSchema,
} from "../../core/src/parameters"
import LLMS from "../../core/src/llms.json"
import {
    logprobToMarkdown,
    topLogprobsToMarkdown,
} from "../../core/src/logprob"

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
        readonly options: any
    ) {
        super()
        this.runId = "" + Math.random()
        this.ws = new WebSocket(`/?api-key=${apiKey}`)
        this.ws.addEventListener(
            "open",
            () => {
                console.log(`run ${this.runId}: open`)
                const id = "" + Math.random()
                const files: string[] = []

                this.ws?.send(
                    JSON.stringify({
                        id,
                        type: "script.start",
                        runId: this.runId,
                        script,
                        files,
                        options,
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

const ApiContext = createContext<{
    project: Promise<Project | undefined>
    scriptid: string | undefined
    setScriptid: (id: string) => void
    parameters: PromptParameters
    setParameters: Dispatch<SetStateAction<PromptParameters>>
    options: ModelOptions
    setOptions: Dispatch<SetStateAction<ModelOptions>>
} | null>(null)

function ApiProvider({ children }: { children: React.ReactNode }) {
    const project = useMemo<Promise<Project>>(fetchScripts, [])
    const [scriptid, setScriptid] = useState<string | undefined>(undefined)
    const [parameters, setParameters] = useState<PromptParameters>({})
    const [options, setOptions] = useState<ModelOptions>({})

    console.log({ scriptid, parameters, options })

    return (
        <ApiContext.Provider
            value={{
                project,
                scriptid,
                setScriptid,
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
    const { scriptid } = useApi()
    const [runner, setRunner] = useState<RunClient | undefined>(undefined)

    console.log({ runner: runner?.runId })
    useEffect(() => {
        runner?.close()
        setRunner(undefined)
    }, [scriptid])

    const run = () => {
        runner?.close()
        if (!scriptid) return

        console.log(`run: start ${scriptid}`)
        const client = new RunClient(scriptid, [], {})
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
        case "string":
            if (field.enum) {
                return (
                    <VscodeSingleSelect
                        value={value as string}
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
                <VscodeTextfield
                    value={value as string}
                    required={required}
                    placeholder={field.default}
                    onChange={(e) => {
                        const target = e.target as HTMLInputElement
                        onChange(target.value)
                    }}
                />
            )
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

function TraceView() {
    const { runner } = useRunner()
    const [trace, setTrace] = useState<string>("")
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
    return <Markdown>{trace}</Markdown>
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
                Problems{" "}
                {annotations.length > 0 ? (
                    <VscodeBadge variant="counter" slot="content-after">
                        annotations.length
                    </VscodeBadge>
                ) : (
                    ""
                )}
            </VscodeTabHeader>
            <VscodeTabPanel>
                <Markdown>{annotationsMarkdown}</Markdown>
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
    //if (/^\s*\{/.test(text)) text = fenceMD(text, "json")
    return (
        <>
            <VscodeTabHeader slot="header">
                Output
            </VscodeTabHeader>
            <VscodeTabPanel>
                <Markdown>{md}</Markdown>
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

function ScriptFormHelper() {
    const script = useScript()
    return (
        <VscodeFormHelper>
            {script
                ? toStringList(script.title, script.description)
                : `Select a GenAIScript to run`}
        </VscodeFormHelper>
    )
}

function ScriptSelect(props: {}) {
    const scripts = useScripts()
    const { scriptid, setScriptid, setParameters } = useApi()

    return (
        <VscodeFormContainer>
            <VscodeFormGroup>
                <VscodeLabel style={{ padding: 0 }}>
                    <GenAIScriptLogo height="2em" />
                </VscodeLabel>
                <VscodeSingleSelect
                    value={scriptid || ""}
                    onChange={(e) => {
                        const target = e.target as HTMLSelectElement
                        setScriptid(target.value)
                        setParameters({})
                    }}
                >
                    {scripts.map(({ id, title }) => (
                        <VscodeOption value={id} description={title}>
                            {id}
                        </VscodeOption>
                    ))}
                </VscodeSingleSelect>
                <ScriptFormHelper />
            </VscodeFormGroup>
            <PromptParametersForm />
            <RunButton />
        </VscodeFormContainer>
    )
}

function PromptParametersForm() {
    const script = useScript()
    if (!script?.parameters) return null

    const { parameters, setParameters } = useApi()
    const schema = useMemo(
        () =>
            promptParametersSchemaToJSONSchema(
                script.parameters
            ) as JSONSchemaObject,
        [script]
    )

    return (
        <JSONSchemaObjectForm
            schema={schema}
            value={parameters}
            onChange={setParameters}
        />
    )
}

function ModelConnectionOptionsForm() {
    const { options, setOptions } = useApi()

    const schema: JSONSchemaObject = {
        type: "object",
        properties: {
            provider: {
                type: "string",
                description: "LLM provider",
                enum: LLMS.providers.map((p) => p.id),
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
        <VscodeCollapsible title="Options">
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
            <ScriptSelect />
            <ModelConnectionOptionsForm />
        </form>
    )
}

function WebApp() {
    return (
        <>
            <RunForm />
            <VscodeTabs panel>
                <VscodeTabHeader slot="header">Trace</VscodeTabHeader>
                <VscodeTabPanel>
                    <TraceView />
                </VscodeTabPanel>
                <ProblemsTabPanel />
                <OutputTabPanel />
            </VscodeTabs>
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
