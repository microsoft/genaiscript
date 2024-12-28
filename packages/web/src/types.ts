// src/types.ts
export interface JSONSchemaFieldType {
    type: "string" | "boolean" | "number"
    title?: string
    description?: string
    format?: "textarea"
    enum?: string[]
}

export interface JSONSchema {
    type: "object"
    properties: {
        [key: string]: JSONSchemaFieldType
    }
}

export interface FormData {
    [key: string]: string | boolean | number
}
