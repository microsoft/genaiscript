// src/components/FormField.tsx
import React from "react"
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
