import React from "react"
import Mermaid from "./Mermaid"
import CopySaveButtons from "./Buttons"

function CodeRender(props: { className?: string; children: any }) {
    const { className, children, ...restProps } = props
    if (className?.includes("language-mermaid"))
        return <Mermaid {...restProps} value={String(children)} />
    return (
        <code className={className} {...restProps}>
            {children}
        </code>
    )
}

export default function Code(props: {
    className?: string
    filename?: string
    children: any
}) {
    const { className, filename, children, ...restProps } = props
    return (
        <div className="snippet">
            <CodeRender className={className} {...restProps}>
                {children}
            </CodeRender>
            <CopySaveButtons filename={filename}>{children}</CopySaveButtons>
        </div>
    )
}
