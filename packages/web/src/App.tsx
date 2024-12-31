// src/components/FormField.tsx
import React, {
    createContext,
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
} from "@vscode-elements/react-elements"
import Markdown from "./Markdown"
import type {
    Project,
    PromptScriptListResponse,
} from "../../core/src/server/messages"
import {
    promptParametersSchemaToJSONSchema,
    promptParameterTypeToJSONSchema,
} from "../../core/src/parameters"
import { useSearchParams } from "./useSearchParam"

const urlParams = new URLSearchParams(window.location.hash)
const apiKey = urlParams.get("api-key")
window.location.hash = ""

const ws = new WebSocket(`/?api-key=${apiKey}`)
ws.addEventListener(
    "open",
    () => {
        console.log(`ws: connected`)
    },
    false
)

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

const ApiContext = createContext<{
    project: Promise<Project | undefined>
    scriptid: string | undefined
    setScriptid: (id: string) => void
} | null>(null)

function ApiProvider({ children }: { children: React.ReactNode }) {
    const [project, setProject] = useState<Promise<Project>>(fetchScripts())
    const [scriptid, setScriptid] = useState<string | undefined>(undefined)

    return (
        <ApiContext.Provider value={{ project, scriptid, setScriptid }}>
            {children}
        </ApiContext.Provider>
    )
}

function useApi() {
    const api = use(ApiContext)
    if (!api) throw new Error("missing content")
    return api
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

function JSONSchemaSimpleTypeFormField(props: {
    field: JSONSchemaSimpleType
    value: string | boolean | number | object
    onChange: (value: string | boolean | number | object) => void
}) {
    const { field, value, onChange } = props
    const required = field.default === undefined

    switch (field.type) {
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

function TraceView(props: { markdown: string }) {
    const { markdown } = props
    return <Markdown>{markdown}</Markdown>
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
                ? toStringList(
                      script.title,
                      script.description,
                      script.filename
                  )
                : `Select a GenAIScript to run`}
        </VscodeFormHelper>
    )
}

function ScriptSelect(props: {}) {
    const scripts = useScripts()
    const { scriptid, setScriptid } = useApi()

    return (
        <VscodeFormContainer>
            <VscodeFormGroup>
                <VscodeLabel>Script</VscodeLabel>
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
    )
}

function ScriptPreview() {
    const script = useScript()
    if (!script) return null

    const { jsSource, text, ...rest } = script
    return (
        <Markdown>
            {`### ${script.id}

${script.description || ""}

- ${script.filename}

\`\`\`json 
${JSON.stringify(rest, null, 2)}
\`\`\` 

`}
        </Markdown>
    )
}

function PromptParametersForm(props: {
    value: PromptParameters
    onChange: React.Dispatch<React.SetStateAction<PromptParameters>>
}) {
    const script = useScript()
    const { value, onChange } = props
    if (!script?.parameters) return null

    const properties = useMemo(() => {
        const schema = promptParametersSchemaToJSONSchema(
            script.parameters
        ) as JSONSchemaObject
        const properties = (schema?.properties || {}) as Record<
            string,
            JSONSchemaSimpleType
        >
        return properties
    }, [script])

    const handleFieldChange = (
        fieldName: string,
        value: string | boolean | number | object
    ) => {
        onChange((prev) => ({
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

function WebApp() {
    const api = use(ApiContext)
    if (!api) throw new Error("missing content")

    const project = use(api.project)
    const scripts = project?.scripts?.filter((s) => !s.isSystem) || []
    const { scriptid, setScriptid } = api
    const script = scripts.find((s) => s.id === scriptid)

    const [formData, setFormData] = useState<PromptParameters>({})
    const [markdown, setMarkdown] = useState<string>("")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const markdownOutput = Object.entries(formData)
            .map(([key, value]) => `### ${key}\n${value}`)
            .join("\n\n")
        setMarkdown(markdownOutput)
    }

    return (
        <>
            <form onSubmit={handleSubmit}>
                <ScriptSelect />
                <PromptParametersForm value={formData} onChange={setFormData} />
                {script && (
                    <VscodeFormContainer>
                        <VscodeButton type="submit">
                            Generate Markdown
                        </VscodeButton>
                    </VscodeFormContainer>
                )}
            </form>
            <TraceView markdown={markdown} />
            <ScriptPreview />
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
