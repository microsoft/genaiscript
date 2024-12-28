// src/schema.ts
import { JSONSchema } from "./types"

export const sampleSchema: JSONSchema = {
    type: "object",
    properties: {
        title: {
            type: "string",
            title: "Title",
            description: "Enter the document title",
        },
        content: {
            type: "string",
            title: "Content",
            description: "Enter the main content",
            format: "textarea",
        },
        category: {
            type: "string",
            title: "Category",
            enum: ["Documentation", "Tutorial", "Blog Post"],
        },
        published: {
            type: "boolean",
            title: "Published",
        },
    },
}
