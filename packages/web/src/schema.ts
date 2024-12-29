/// <reference path="../../core/src/types/prompt_template.d.ts" />
export const sampleSchema: JSONSchemaObject = {
    type: "object",
    properties: {
        title: {
            type: "string",
            description: "Enter the document title",
        },
        content: {
            type: "string",
            description: "Enter the main content",
        },
        category: {
            type: "string",
            enum: ["Documentation", "Tutorial", "Blog Post"],
        },
        published: {
            type: "boolean",
        },
    },
}
