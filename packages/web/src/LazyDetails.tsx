import React, { useState, useRef, startTransition } from "react"

export default function LazyDetails(props: {
    className?: string
    children: React.ReactNode
    open?: boolean
}) {
    const { className, open, children } = props
    const [isOpen, setIsOpen] = useState(open)
    const detailsRef = useRef<HTMLDetailsElement>(null)

    let summary = "Details"
    let content = null
    if (Array.isArray(children) && children.length > 0) {
        const firstChildIndex = children.findIndex((c) => typeof c !== "string")
        const firstChild = children[firstChildIndex]
        if (firstChild && React.isValidElement(firstChild) && firstChild.type === "summary") {
            summary = String((firstChild as React.JSX.Element).props.children)
            content = children.slice(firstChildIndex + 1)
        }
    }

    const handleToggle = () =>
        startTransition(() => setIsOpen(detailsRef.current?.open ?? false))

    return (
        <details
            className={className}
            ref={detailsRef}
            open={open}
            onToggle={handleToggle}
        >
            <summary>{summary}</summary>
            {isOpen ? content : null}
        </details>
    )
}
