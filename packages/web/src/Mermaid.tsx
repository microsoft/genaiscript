// src/components/FormField.tsx
import React, { useEffect, useMemo, useRef } from "react"
import { ErrorBoundary } from "react-error-boundary"
import mermaid from "mermaid"
import { useAttributeValue } from "./useAttributeValue"

mermaid.initialize({
    startOnLoad: false,
    securityLevel: "strict",
})

function MermaidInternal(props: { value: string }) {
    const { value } = props
    const bodyClassName = useAttributeValue(document.body, "class")
    const theme = bodyClassName?.includes("dark") ? "dark" : "default"
    const ref = useRef<HTMLDivElement>(null)
    const src = useMemo(() => {
        try {
            mermaid.detectType(value)
            return value
        } catch (error) {
            return `graph TD; ` + value
        }
    }, [value])

    useEffect(() => {
        if (ref.current) {
            mermaid.initialize({ theme })
            mermaid.run({ nodes: [ref.current], suppressErrors: true })
        }
    }, [value, theme])
    if (!value) return null
    return (
        <div className="mermaid" ref={ref}>
            {src}
        </div>
    )
}

export default function Mermaid(props: { value: string }) {
    return (
        <ErrorBoundary
            fallback={<p>⚠️Something went wrong while rendering mermaid.</p>}
        >
            <MermaidInternal {...props} />
        </ErrorBoundary>
    )
}
