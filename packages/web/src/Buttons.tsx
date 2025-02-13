import React, { useState } from "react"

import "@vscode-elements/elements/dist/vscode-button"
import AIDisclaimer from "./AIDisplaimer"

function extractTextFromChildren(children: any): string {
    if (!children) return ""

    return React.Children.toArray(children).reduce((text, child) => {
        if (typeof child === "string") {
            return text + child
        } else if (React.isValidElement(child)) {
            return text + extractTextFromChildren((child.props as any).children)
        }
        return text
    }, "") as string
}

function CopyButton(props: { children: any; text?: string }) {
    const { children, text } = props
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        try {
            const res = text || extractTextFromChildren(children) // TODO: keep upstream text somewhere?
            await navigator.clipboard.writeText(res)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {}
    }
    const title = copied ? "Copied!" : "Copy"
    return (
        <vscode-button
            aria-label="Copy"
            icon="copy"
            secondary
            onClick={handleCopy}
            title={title}
        >
            {title}
        </vscode-button>
    )
}

function SaveButton(props: {
    filename?: string
    children: any
    text?: string
}) {
    const { children, text, filename } = props
    const [saved, setSaved] = useState(false)

    const handleSave = async () => {
        try {
            const res = text || extractTextFromChildren(children) // TODO: keep upstream text somewhere?
            const blob = new Blob([res], { type: "text/plain" })
            let url: string
            let a: HTMLAnchorElement
            try {
                url = URL.createObjectURL(blob)
                a = document.createElement("a")
                a.href = url
                a.download = filename || "code.txt"
                document.body.appendChild(a)
                a.click()
            } finally {
                if (a) document.body.removeChild(a)
                if (url) URL.revokeObjectURL(url)
            }
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
        } catch (err) {}
    }
    const title = saved ? "Saved!" : "Save"
    return (
        <vscode-button
            aria-label="Save to file"
            icon="save"
            secondary
            onClick={handleSave}
            title={title}
        >
            {title}
        </vscode-button>
    )
}

export default function CopySaveButtons(props: {
    children: any
    filename?: string
    text?: string
    aiDisclaimer?: boolean
}) {
    const { children, text, aiDisclaimer } = props
    if (!children?.length && !text) return null
    return (
        <div className="buttons">
            <CopyButton {...props} />
            <SaveButton {...props} />
            {aiDisclaimer ? <AIDisclaimer /> : null}
        </div>
    )
}
