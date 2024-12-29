// src/components/JsonSchemaForm.tsx
import React, { useState } from "react"
import { marked } from "marked"
import { JSONSChemaFormData } from "../types"
import validator from "@rjsf/validator-ajv8"
import Form from "@rjsf/core"

export default function JSONSchemaForm(props: { schema: JSONSchemaObject }) {
    const { schema } = props
    const [formData, setFormData] = useState<JSONSChemaFormData>({})
    const [markdown, setMarkdown] = useState<string>("")

    const handleSubmit = () => {
        const markdownOutput = Object.entries(formData)
            .map(([key, value]) => `### ${key}\n${value}`)
            .join("\n\n")
        setMarkdown(markdownOutput)
    }

    const log = (type: any) => console.log.bind(console, type)
    return (
        <div className="container">
            <Form
                schema={schema as any}
                validator={validator}
                formData={formData}
                onChange={(e) => setFormData(e.formData)}
                onSubmit={handleSubmit}
                onError={log("errors")}
            />
            {markdown && (
                <div className="markdown-output">
                    <h2>Output:</h2>
                    <div
                        dangerouslySetInnerHTML={{
                            __html: marked(markdown) as any,
                        }}
                        className="markdown-content"
                    />
                </div>
            )}
        </div>
    )
}
