import React from "react"

import "@vscode-elements/elements/dist/vscode-tabs"
import MarkdownPreviewTabs from "./MarkdownPreviewTabs"

export default function MarkdownWithPreview(props: {
    className?: string
    children: any
}) {
    return (
        <vscode-tabs>
            <MarkdownPreviewTabs {...props} />
        </vscode-tabs>
    )
}
