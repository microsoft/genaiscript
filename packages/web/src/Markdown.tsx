// src/components/FormField.tsx
import React, { JSX } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import rehypeSanitize from "rehype-sanitize"
import clsx from "clsx"
import { remarkAlert } from "remark-github-blockquote-alert"
import rehypeMermaid from "rehype-mermaid"
import rehypeKatex from "rehype-katex"
import remarkMath from "remark-math"
import { details } from "../../core/src/markdown"

export default function Markdown(props: { className?: string; children: any }) {
    const { className, children } = props
    return children ? (
        <div className={clsx("markdown", className)}>
            <ReactMarkdown
                rehypePlugins={[
                    rehypeMermaid,
                    rehypeKatex,
                    rehypeRaw,
                    rehypeSanitize,
                ]}
                remarkPlugins={[remarkMath, remarkGfm, remarkAlert]}
            >
                {children}
            </ReactMarkdown>
        </div>
    ) : null
}
