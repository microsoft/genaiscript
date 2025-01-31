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
import Code from "./Code"

const genaiscriptSchema = Object.freeze({
    ...defaultSchema,
    tagNames: [...defaultSchema.tagNames, "blockquote", "svg", "path"],
    protocols: {
        ...defaultSchema.protocols,
        src: ["http", "https", "data"],
    },
    attributes: {
        ...defaultSchema.attributes,
        blockquote: [["className", /^markdown-./], /^aria-./],
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
})

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
                            if (!/hljs/.test(className))
                                return <code {...props}>{children}</code>
                            else return <Code {...props}>{children}</Code>
                        },
                    }}
                    urlTransform={(url) => {
                        return url
                    }}
                    rehypePlugins={[
                        rehypeRaw,
                        [rehypeSanitize, genaiscriptSchema],
                        rehypeMathML,
                        [rehypeHighlight, { ignoreMissing: true }],
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
