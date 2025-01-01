// src/components/FormField.tsx
import React, {
    createContext,
    Dispatch,
    SetStateAction,
    startTransition,
    Suspense,
    use,
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
} from "@vscode-elements/react-elements"
import Markdown from "./Markdown"
import type {
    Project,
    PromptScriptListResponse,
    PromptScriptProgressResponseEvent,
    PromptScriptResponseEvents,
    PromptScriptStart,
    RequestMessage,
} from "../../core/src/server/messages"
import {
    promptParametersSchemaToJSONSchema,
    promptParameterTypeToJSONSchema,
} from "../../core/src/parameters"
import LLMS from "../../core/src/llms.json"

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

class TraceEvent extends Event {
    constructor(readonly trace: string) {
        super("trace")
    }
}

class RunClient extends EventTarget {
    ws?: WebSocket
    runId: string
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
                console.log({ ws: this.ws })
            },
            false
        )
        this.ws.addEventListener("message", (ev) => {
            const data: PromptScriptResponseEvents = JSON.parse(ev.data)
            switch (data.type) {
                case "script.progress": {
                    if (data.trace)
                        this.dispatchEvent(new TraceEvent(data.trace))
                    break
                }
                default: {
                    console.debug(data.type)
                    this.dispatchEvent(new Event(data.type))
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
    const [project, setProject] = useState<Promise<Project>>(fetchScripts())
    const [scriptid, setScriptid] = useState<string | undefined>(undefined)
    const [parameters, setParameters] = useState<PromptParameters>({})
    const [options, setOptions] = useState<ModelOptions>({})

    console.log({ api: scriptid })
    useEffect(() => {
        setParameters({})
    }, [scriptid])

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
    trace: string
    setTrace: Dispatch<SetStateAction<string>>
    run: () => void
    cancel: () => void
    state: "running" | undefined
} | null>(null)

function RunnerProvider({ children }: { children: React.ReactNode }) {
    const { scriptid } = useApi()
    const [runner, setRunner] = useState<RunClient | undefined>(undefined)
    const [trace, setTrace] = useState<string>("")

    console.log({ runner: runner?.runId })
    useEffect(() => {
        runner?.close()
        setRunner(undefined)
    }, [scriptid])

    const appendTrace = (delta: string) => {
        startTransition(() => {
            setTrace((previous) => previous + delta)
        })
    }

    const run = () => {
        runner?.close()
        if (!scriptid) return

        console.log(`run: start`)
        setTrace("")
        const client = new RunClient(scriptid, [], {})
        client.addEventListener(
            "trace",
            (ev) => {
                appendTrace((ev as TraceEvent).trace)
            },
            false
        )
        client.addEventListener("script.end", () => setRunner(undefined))
        setRunner(new RunClient(scriptid, [], {}))
    }
    const cancel = () => {
        runner?.close()
        setRunner(undefined)
    }

    const state = runner ? "running" : undefined

    return (
        <RunnerContext.Provider
            value={{
                trace,
                setTrace,
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
    const { trace } = useRunner()
    return (
        trace && (
            <VscodeCollapsible open title="Trace">
                <Markdown>{trace}</Markdown>
            </VscodeCollapsible>
        )
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
    const { scriptid, setScriptid } = useApi()

    return (
        <VscodeCollapsible open title="Script">
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
            </VscodeFormContainer>
        </VscodeCollapsible>
    )
}

function ScriptPreview() {
    const script = useScript()
    if (!script) return null

    const { jsSource, text, ...rest } = script
    return (
        <VscodeCollapsible title="Details">
            <Markdown>
                {`- ${script.filename || "builtin"}

\`\`\`json 
${JSON.stringify(rest, null, 2)}
\`\`\` 

`}
            </Markdown>
        </VscodeCollapsible>
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
    const { scriptid } = useApi()
    const { run, cancel, state } = useRunner()
    const action = state === "running" ? cancel : run
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        action()
    }

    return (
        scriptid && (
            <VscodeFormContainer>
                <VscodeButton type="submit" onClick={handleSubmit}>
                    {state === "running" ? "Running..." : "Run"}
                </VscodeButton>
            </VscodeFormContainer>
        )
    )
}

function WebApp() {
    return (
        <>
            <ScriptSelect />
            <PromptParametersForm />
            <ModelConnectionOptionsForm />
            <RunnerProvider>
                <RunButton />
                <ScriptPreview />
                <TraceView />
            </RunnerProvider>
        </>
    )
}

export default function App() {
    return (
        <ApiProvider>
            <Suspense fallback={<VscodeProgressRing />}>
                <WebApp />
            </Suspense>
        </ApiProvider>
    )
}
