// src/components/FormField.tsx
import React, { useState } from "react"
import {
    VscodeButton,
    VscodeSingleSelect,
    VscodeOption,
    VscodeTextfield,
    VscodeCheckbox,
} from "@vscode-elements/react-elements"
import { marked } from "marked"

interface FormFieldProps {
    field: JSONSchemaSimpleType
    value: string | boolean | number
    onChange: (value: string | boolean | number) => void
}

const FormField: React.FC<FormFieldProps> = ({ field, value, onChange }) => {
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

interface JsonSchemaFormProps {
    schema: JSONSchemaObject
}

export const JsonSchemaForm: React.FC<JsonSchemaFormProps> = ({ schema }) => {
    const [formData, setFormData] = useState<FormData>({})
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
        value: string | boolean | number
    ) => {
        setFormData((prev) => ({
            ...prev,
            [fieldName]: value,
        }))
    }

    return (
        <div className="container">
            <form onSubmit={handleSubmit}>
                {Object.entries(schema.properties || {}).map(
                    ([fieldName, field]) => (
                        <div key={fieldName} className="field-container">
                            <label>{fieldName}</label>
                            <FormField
                                field={field}
                                value={formData[fieldName] || ""}
                                onChange={(value) =>
                                    handleFieldChange(fieldName, value)
                                }
                            />
                            {field.description && (
                                <small className="description">
                                    {field.description}
                                </small>
                            )}
                        </div>
                    )
                )}
                <VSCodeButton type="submit">Generate Markdown</VSCodeButton>
            </form>

            {markdown && (
                <div className="markdown-output">
                    <h2>Output:</h2>
                    <div
                        dangerouslySetInnerHTML={{ __html: marked(markdown) }}
                        className="markdown-content"
                    />
                </div>
            )}
        </div>
    )
}
