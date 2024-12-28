// src/components/FormField.tsx
import React from "react"
import {
    VSCodeButton,
    VSCodeDropdown,
    VSCodeOption,
    VSCodeTextField,
    VSCodeCheckbox,
    VSCodeTextArea,
} from "@vscode/webview-ui-toolkit/react"
import { JSONSchemaFieldType } from "../types"

interface FormFieldProps {
    field: JSONSchemaFieldType
    value: string | boolean | number
    onChange: (value: string | boolean | number) => void
}

export const FormField: React.FC<FormFieldProps> = ({
    field,
    value,
    onChange,
}) => {
    switch (field.type) {
        case "string":
            if (field.enum) {
                return (
                    <VSCodeDropdown
                        value={value as string}
                        onChange={(e) => {
                            const target = e.target as HTMLSelectElement
                            onChange(target.value)
                        }}
                    >
                        {field.enum.map((option) => (
                            <VSCodeOption key={option} value={option}>
                                {option}
                            </VSCodeOption>
                        ))}
                    </VSCodeDropdown>
                )
            }
            if (field.format === "textarea") {
                return (
                    <VSCodeTextArea
                        value={value as string}
                        onChange={(e) => {
                            const target = e.target as HTMLTextAreaElement
                            onChange(target.value)
                        }}
                    />
                )
            }
            return (
                <VSCodeTextField
                    value={value as string}
                    onChange={(e) => {
                        const target = e.target as HTMLInputElement
                        onChange(target.value)
                    }}
                />
            )
        case "boolean":
            return (
                <VSCodeCheckbox
                    checked={value as boolean}
                    onChange={(e) => {
                        const target = e.target as HTMLInputElement
                        onChange(target.checked)
                    }}
                />
            )
        default:
            return (
                <VSCodeTextField
                    value={value as string}
                    onChange={(e) => {
                        const target = e.target as HTMLInputElement
                        onChange(target.value)
                    }}
                />
            )
    }
}
