/// <reference path="../../core/src/types/prompt_template.d.ts" />
/// <reference path="./vscode-elements.d.ts" />
import React, {
    Dispatch,
    SetStateAction,
    startTransition,
    useEffect,
    useState,
} from "react"

import { underscore } from "inflection"
import "@vscode-elements/elements/dist/vscode-textarea"
import "@vscode-elements/elements/dist/vscode-textfield"
import "@vscode-elements/elements/dist/vscode-single-select"
import "@vscode-elements/elements/dist/vscode-option"
import "@vscode-elements/elements/dist/vscode-checkbox"
import "@vscode-elements/elements/dist/vscode-checkbox-group"
import "@vscode-elements/elements/dist/vscode-form-container"
import "@vscode-elements/elements/dist/vscode-form-group"
import "@vscode-elements/elements/dist/vscode-form-helper"
import "@vscode-elements/elements/dist/vscode-label"
import Markdown from "./Markdown"

function JSONSchemaString(props: {
    field: JSONSchemaString
    value: string
    required?: boolean
    onChange: (value: string) => void
}) {
    const { field } = props
    if (field.enum) return <JSONSchemaStringEnum {...props} />
    if (field.uiSuggestions) return <JSONSchemaStringSuggestions {...props} />
    if (field.uiType === "textarea")
        return <JSONSchemaStringTextArea {...props} />
    return <JSONSchemaStringTextField {...props} />
}

function JSONSchemaStringTextField(props: {
    field: JSONSchemaString
    value: string
    required?: boolean
    onChange: (value: string) => void
}) {
    const { field, required, value, onChange } = props
    const { pattern } = field
    return (
        <vscode-textfield
            pattern={pattern}
            value={value}
            required={required}
            spellCheck={false}
            placeholder={field.default}
            autoCapitalize="off"
            autocomplete="off"
            onInput={(e) => {
                const target = e.target as HTMLInputElement
                onChange(target.value)
            }}
        />
    )
}

function JSONSchemaStringTextArea(props: {
    field: JSONSchemaString
    value: string
    required?: boolean
    onChange: (value: string) => void
}) {
    const { field, required, value, onChange } = props
    const rows = (s: string | undefined) =>
        Math.max(3, s?.split("\n").length ?? 0)
    return (
        <vscode-textarea
            className="vscode-form-wide"
            value={value}
            required={required}
            rows={rows(value)}
            spellCheck={true}
            placeholder={field.default}
            autoCapitalize="off"
            autocomplete="off"
            onInput={(e) => {
                const target = e.target as HTMLTextAreaElement
                target.rows = rows(target.value)
                onChange(target.value)
            }}
        />
    )
}

function JSONSchemaStringSuggestions(props: {
    field: JSONSchemaString
    value: string
    required?: boolean
    onChange: (value: string) => void
}) {
    const { field, required, value, onChange } = props
    const { uiSuggestions: options } = field

    return (
        <vscode-single-select
            value={value}
            required={required}
            creatable
            combobox
            onvsc-change={(e: Event) => {
                const target = e.target as HTMLSelectElement
                onChange(target.value)
            }}
        >
            <vscode-option key="empty" value=""></vscode-option>
            {options.map((option) => (
                <vscode-option key={option} value={option}>
                    {option}
                </vscode-option>
            ))}
        </vscode-single-select>
    )
}

function JSONSchemaStringEnum(props: {
    field: JSONSchemaString
    value: string
    required?: boolean
    onChange: (value: string) => void
}) {
    const { field, required, value, onChange } = props
    const { enum: options } = field

    return (
        <vscode-single-select
            value={value}
            required={required}
            combobox
            onvsc-change={(e: Event) => {
                const target = e.target as HTMLSelectElement
                onChange(target.value)
            }}
        >
            <vscode-option key="empty" value=""></vscode-option>
            {options.map((option) => (
                <vscode-option key={option} value={option}>
                    {option}
                </vscode-option>
            ))}
        </vscode-single-select>
    )
}

function JSONSchemaNumber(props: {
    schema: JSONSchemaNumber
    value: number
    required: boolean
    onChange: (value: number) => void
}) {
    const { required, schema, value, onChange } = props
    const { type, minimum, maximum } = schema
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
            placeholder={isNaN(schema.default) ? "" : String(schema.default)}
            min={minimum}
            max={maximum}
            autoCapitalize="off"
            autocomplete="off"
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

    switch (field.type) {
        case "number":
        case "integer":
            return (
                <JSONSchemaNumber
                    schema={field}
                    value={Number(value)}
                    onChange={onChange}
                    required={required}
                />
            )
        case "string": {
            return (
                <JSONSchemaString
                    field={field}
                    value={value as string}
                    required={required}
                    onChange={onChange}
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

function fieldDisplayName(
    fieldPrefix: string,
    fieldName: string,
    field: JSONSchemaSimpleType
) {
    return underscore(
        (fieldPrefix ? `${fieldPrefix} / ` : fieldPrefix) +
            (field.title || fieldName)
    ).replaceAll(/[_\.]/g, " ")
}

export function JSONBooleanOptionsGroup(props: {
    properties: Record<string, JSONSchemaBoolean>
    value: any
    onChange: Dispatch<SetStateAction<any>>
    fieldPrefix: string
}) {
    const { properties, value, onChange, fieldPrefix } = props

    const handleFieldChange = (fieldName: string, value: any) => {
        onChange((prev: any) => ({
            ...prev,
            [fieldName]: value,
        }))
    }

    if (!properties) return null

    return (
        <vscode-checkbox-group>
            {Object.entries(properties).map(([fieldName, field]) => (
                <vscode-checkbox
                    key={fieldName}
                    label={fieldDisplayName(fieldPrefix, fieldName, field)}
                    title={field.description}
                    checked={value[fieldPrefix + fieldName]}
                    onChange={(e) =>
                        handleFieldChange(
                            fieldPrefix + fieldName,
                            (e.target as HTMLInputElement).checked
                        )
                    }
                />
            ))}
        </vscode-checkbox-group>
    )
}

export function JSONSchemaObjectForm(props: {
    schema: JSONSchemaObject
    value: any
    onChange: Dispatch<SetStateAction<any>>
    fieldPrefix: string
}) {
    const { schema, value, onChange, fieldPrefix } = props
    const properties: Record<string, JSONSchemaSimpleType> =
        schema.properties ?? ({} as any)
    const groupedProperties = Object.groupBy(
        Object.entries(properties),
        ([, field]) => field.uiGroup || ""
    )

    return (
        <>
            {Object.entries(groupedProperties).map(([group, fields]) => (
                <JSONSchemaObjectPropertiesForm
                    key={group || ""}
                    schema={schema}
                    group={group}
                    properties={fields}
                    value={value}
                    onChange={onChange}
                    fieldPrefix={fieldPrefix}
                />
            ))}
        </>
    )
}

function JSONSchemaObjectPropertiesForm(props: {
    schema: JSONSchemaObject
    group: string
    properties: [string, JSONSchemaSimpleType][]
    value: any
    onChange: Dispatch<SetStateAction<any>>
    fieldPrefix: string
}) {
    const { group, schema, properties, value, onChange, fieldPrefix } = props
    const handleFieldChange = (fieldName: string, value: any) => {
        onChange((prev: any) => ({
            ...prev,
            [fieldName]: value,
        }))
    }

    const fieldElements = properties.map(([fieldName, field]) => (
        <vscode-form-group key={fieldPrefix + fieldName}>
            <vscode-label>
                {fieldDisplayName(fieldPrefix, fieldName, field)}
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
                    <Markdown>{field.description}</Markdown>
                </vscode-form-helper>
            )}
        </vscode-form-group>
    ))
    if (!group) return fieldElements

    return (
        <vscode-collapsible title={group} open={false}>
            {fieldElements}
        </vscode-collapsible>
    )
}
