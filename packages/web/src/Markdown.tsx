// src/components/FormField.tsx
import React, { useEffect, useRef, useState } from "react"
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
import CopySaveButtons from "./Buttons"
import DataTableTabs from "./DataTableTabs"

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
        span: [["className", /^logprobs$/], "style"],
        table: [["className", /^toplogprobs$/], "style"],
        details: [["className", /^reasoning$/]],
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

const readmeSchema = Object.freeze({
    ...genaiscriptSchema,
    tagNames: genaiscriptSchema.tagNames.filter(
        (tag) =>
            tag !== "img" &&
            tag !== "video" &&
            tag !== "audio" &&
            tag !== "iframe"
    ),
})

export default function Markdown(props: {
    aiDisclaimer?: boolean
    className?: string
    children: any
    copySaveButtons?: boolean
    filename?: string
    text?: string
    readme?: boolean
}) {
    const {
        className,
        aiDisclaimer,
        filename,
        text,
        children,
        copySaveButtons,
        readme,
    } = props

    const [isVisible, setIsVisible] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true)
                    observer.unobserve(ref.current)
                }
            },
            {
                rootMargin: "0px",
                threshold: 0.1,
            }
        )
        if (ref.current) observer.observe(ref.current)
        return () => {
            if (ref.current) {
                observer.unobserve(ref.current)
            }
        }
    }, [])

    return (
        <div ref={ref} className={clsx("markdown-body", className)}>
            {isVisible && children ? (
                <ErrorBoundary
                    fallback={
                        <p>⚠️Something went wrong while rendering markdown.</p>
                    }
                >
                    <ReactMarkdown
                        components={{
                            pre({ node, className, children, ...props }) {
                                const codeClassName = (node as any)
                                    .children?.[0]?.properties
                                    ?.className?.[1] as string
                                const codeText = (node as any).children?.[0]
                                    ?.children?.[0]?.value as string
                                if (
                                    /language-(barchart|linechart)/.test(
                                        codeClassName
                                    )
                                )
                                    return (
                                        <DataTableTabs
                                            chart={codeClassName}
                                            {...props}
                                        >
                                            {codeText}
                                        </DataTableTabs>
                                    )
                                return (
                                    <pre className={className} {...props}>
                                        {children}
                                    </pre>
                                )
                            },
                            code({ node, className, children, ...props }) {
                                if (!/hljs/.test(className))
                                    return (
                                        <code className={className} {...props}>
                                            {children}
                                        </code>
                                    )
                                return (
                                    <Code className={className} {...props}>
                                        {children}
                                    </Code>
                                )
                            },
                        }}
                        urlTransform={(url) => {
                            return url
                        }}
                        rehypePlugins={[
                            rehypeRaw,
                            [
                                rehypeSanitize,
                                readme ? readmeSchema : genaiscriptSchema,
                            ],
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
                    {copySaveButtons ? (
                        <CopySaveButtons
                            aiDisclaimer={aiDisclaimer}
                            filename={filename}
                            text={text}
                        >
                            {children}
                        </CopySaveButtons>
                    ) : null}
                </ErrorBoundary>
            ) : null}
        </div>
    )
}
