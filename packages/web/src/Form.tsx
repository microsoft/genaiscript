// src/components/FormField.tsx
import React, { useState } from "react"
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
import Markdown from "react-markdown"
import remarkGfm from "remark-gfm"

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
    return markdown ? (
        <div className="markdown-output">
            <Markdown remarkPlugins={[remarkGfm]}>{markdown}</Markdown>
        </div>
    ) : null
}

export default function JSONForm(props: { schema: JSONSchemaObject }) {
    const { schema } = props
    const properties = (schema.properties || {}) as Record<
        string,
        JSONSchemaSimpleType
    >
    const [formData, setFormData] = useState<PromptParameters>({})
    const [markdown, setMarkdown] = useState<string>("")

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        const markdownOutput = Object.entries(formData)
            .map(([key, value]) => `### ${key}\n${value}`)
            .join("\n\n")
        setMarkdown(markdownOutput)
    }

    const handleFieldChange = (
        fieldName: string,
        value: string | boolean | number | object
    ) => {
        setFormData((prev) => ({
            ...prev,
            [fieldName]: value,
        }))
    }

    return (
        <>
            <form onSubmit={handleSubmit}>
                <VscodeFormContainer>
                    {Object.entries(properties).map(([fieldName, field]) => (
                        <VscodeFormGroup key={fieldName}>
                            <VscodeLabel>{fieldName}</VscodeLabel>
                            <JSONSchemaSimpleTypeFormField
                                field={field}
                                value={formData[fieldName]}
                                onChange={(value) =>
                                    handleFieldChange(fieldName, value)
                                }
                            />
                            {field?.description && (
                                <VscodeFormHelper>
                                    {field.description}
                                </VscodeFormHelper>
                            )}
                        </VscodeFormGroup>
                    ))}
                    <VscodeButton type="submit">Generate Markdown</VscodeButton>
                </VscodeFormContainer>
            </form>
            <TraceView markdown={markdown} />
        </>
    )
}
