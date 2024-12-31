// src/components/FormField.tsx
import React, { JSX } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

export default function Markdown(props: { children: any }) {
    const { children } = props
    return children ? (
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    ) : null
}
