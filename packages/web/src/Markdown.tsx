// src/components/FormField.tsx
import React, { use, useEffect, useMemo, useRef } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeRaw from "rehype-raw"
import rehypeSanitize, { defaultSchema } from "rehype-sanitize"
import clsx from "clsx"
import "remark-github-blockquote-alert/alert.css"
import { remarkAlert } from "remark-github-blockquote-alert"
import remarkMath from "remark-math"
import rehypeMathML from "@daiji256/rehype-mathml"
import { ErrorBoundary } from "react-error-boundary"
import rehypeHighlight from "rehype-highlight"
import Mermaid from "./Mermaid"

export default function Markdown(props: { className?: string; children: any }) {
    const { className, children } = props
    return children ? (
        <div className={clsx("markdown-body", className)}>
            <ErrorBoundary
                fallback={
                    <p>⚠️Something went wrong while rendering markdown.</p>
                }
            >
                <ReactMarkdown
                    components={{
                        code({ node, className, children, ...props }) {
                            if (className?.includes("language-mermaid")) {
                                return <Mermaid value={String(children)} />
                            }
                            return (
                                <code className={className} {...props}>
                                    {children}
                                </code>
                            )
                        },
                    }}
                    rehypePlugins={[
                        rehypeRaw,
                        [
                            rehypeSanitize,
                            {
                                ...defaultSchema,
                                tagNames: [
                                    ...defaultSchema.tagNames,
                                    "blockquote",
                                    "svg",
                                    "path",
                                ],
                                attributes: {
                                    ...defaultSchema.attributes,
                                    blockquote: [
                                        ["className", /^markdown-./],
                                        /^aria-./,
                                    ],
                                    p: [["className", /^markdown-./]],
                                    svg: [
                                        ["className", "octicon", /^markdown-./],
                                        "viewBox",
                                        "width",
                                        "height",
                                        /^aria-./,
                                    ],
                                    path: ["d", /^aria-./],
                                    code: [
                                        [
                                            "className",
                                            /^language-./,
                                            /^aria-./,
                                            "math-inline",
                                            "math-display",
                                        ],
                                    ],
                                },
                            },
                        ],
                        rehypeMathML,
                        rehypeHighlight,
                    ]}
                    remarkPlugins={[
                        remarkMath,
                        remarkGfm,
                        [remarkAlert, { tagName: "blockquote" }],
                    ]}
                >
                    {children}
                </ReactMarkdown>
            </ErrorBoundary>
        </div>
    ) : null
}
