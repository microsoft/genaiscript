// src/components/FormField.tsx
import React, { JSX } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import rehypeSanitize from "rehype-sanitize"
import clsx from "clsx"
import { remarkAlert } from "remark-github-blockquote-alert"
import remarkMath from "remark-math"
import rehypeMathML from "@daiji256/rehype-mathml"
import { ErrorBoundary } from "react-error-boundary"

export default function Markdown(props: { className?: string; children: any }) {
    const { className, children } = props
    return children ? (
        <div className={clsx("markdown-body", className)}>
            <ErrorBoundary fallback={<p>⚠️Something went wrong while rendering markdown.</p>}>
                <ReactMarkdown
                    rehypePlugins={[
                        rehypeRaw,
                        rehypeMathML,
                        rehypeSanitize,
                    ]}
                    remarkPlugins={[remarkMath, remarkGfm, remarkAlert]}
                >
                    {children}
                </ReactMarkdown>
            </ErrorBoundary>
        </div>
    ) : null
}
