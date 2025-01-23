import React, { useState } from "react"
import Mermaid from "./Mermaid"
import { VscodeButton } from "@vscode-elements/react-elements"

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

export default function Code(props: { className?: string; children: any }) {
    const { className, children, ...restProps } = props
    const [copied, setCopied] = useState(false)
    const text = String(children)

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {}
    }

    return (
        <div className="snippet">
            <CodeRender className={className} {...restProps}>
                {children}
            </CodeRender>
            <VscodeButton
                className="button"
                aria-label="Copy"
                secondary
                onClick={handleCopy}
            >
                {copied ? "Copied!" : "Copy"}
            </VscodeButton>
        </div>
    )
}
