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

function JSONSchemaSimpleTypeFormField(props: {
    field: JSONSchemaSimpleType
    value: string | boolean | number | object
    onChange: (value: string | boolean | number | object) => void
}) {
    const { field, value, onChange } = props
    switch (field.type) {
        case "string":
            if (field.enum) {
                return (
                    <VscodeSingleSelect
                        value={value as string}
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

function ScriptPreview(props: { script: PromptScript | undefined }) {
    const { script } = props
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
    script: PromptScript | undefined
    value: PromptParameters
    onChange: React.Dispatch<React.SetStateAction<PromptParameters>>
}) {
    const { script, value, onChange } = props
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
                        <VscodeFormHelper>
                            Select a GenAIScript to run
                        </VscodeFormHelper>
                    </VscodeFormGroup>
                </VscodeFormContainer>
                <ScriptPreview script={script} />
                <PromptParametersForm
                    script={script}
                    value={formData}
                    onChange={setFormData}
                />
                {script && (
                    <VscodeFormContainer>
                        <VscodeButton type="submit">
                            Generate Markdown
                        </VscodeButton>
                    </VscodeFormContainer>
                )}
            </form>
            <TraceView markdown={markdown} />
        </>
    )
}

export default function App() {
    return (
        <ApiProvider>
            <Suspense fallback={<h1>Loading...</h1>}>
                <WebApp />
            </Suspense>
        </ApiProvider>
    )
}
