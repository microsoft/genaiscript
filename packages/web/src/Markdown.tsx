// src/components/FormField.tsx
import React, { JSX } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import rehypeSanitize from "rehype-sanitize"
import clsx from "clsx"
import { remarkAlert } from "remark-github-blockquote-alert"
import rehypeMermaid from "rehype-mermaid"
import remarkMath from "remark-math"
import rehypeMathML from '@daiji256/rehype-mathml'

export default function Markdown(props: { className?: string; children: any }) {
    const { className, children } = props
    return children ? (
        <div className={clsx("markdown-body", className)}>
            <ReactMarkdown
                rehypePlugins={[
                    rehypeRaw,
                    rehypeMermaid,
                    rehypeMathML,
                    rehypeSanitize,
                ]}
                remarkPlugins={[remarkMath, remarkGfm, remarkAlert]}
            >
                {children}
            </ReactMarkdown>
        </div>
    ) : null
}
