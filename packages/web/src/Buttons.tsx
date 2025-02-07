import React, { useState } from "react"
import Mermaid from "./Mermaid"

import "@vscode-elements/elements/dist/vscode-button"

export function CopyButton(props: { text: string }) {
    const { text } = props
    const [copied, setCopied] = useState(false)

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {}
    }
    return (
        <vscode-button
            aria-label="Copy"
            icon="copy"
            secondary
            onClick={handleCopy}
        >
            {copied ? "Copied!" : "Copy"}
        </vscode-button>
    )
}

export function SaveButton(props: { name?: string; text: string }) {
    const { text, name } = props
    const [saved, setSaved] = useState(false)

    const handleSave = async () => {
        try {
            const blob = new Blob([text], { type: "text/plain" })
            let url: string
            let a: HTMLAnchorElement
            try {
                url = URL.createObjectURL(blob)
                a = document.createElement("a")
                a.href = url
                a.download = name || "code.txt"
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
    return (
        <vscode-button
            aria-label="Save to file"
            icon="save"
            secondary
            onClick={handleSave}
        >
            {saved ? "Saved!" : "Save"}
        </vscode-button>
    )
}

export default function CopySaveButtons(props: {
    text: string
    name?: string
}) {
    const { text } = props
    if (!text) return null
    return (
        <div className="buttons">
            <CopyButton {...props} />
            <SaveButton {...props} />
        </div>
    )
}
