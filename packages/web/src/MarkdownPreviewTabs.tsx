import React from "react"
import { fenceMD } from "../../core/src/mkmd"
import Markdown from "./Markdown"
import { convertThinkToMarkdown } from "../../core/src/think"
import { convertAnnotationsToMarkdown } from "../../core/src/annotations"

import "@vscode-elements/elements/dist/vscode-tab-header"
import "@vscode-elements/elements/dist/vscode-tab-panel"

export default function MarkdownWithPreviewTabs(props: {
    className?: string
    filename?: string
    children: any
}) {
    const { className, filename, children } = props
    const md = convertThinkToMarkdown(
        convertAnnotationsToMarkdown(children as string)
    )
    const text = String(children)
    return (
        <>
            <vscode-tab-header slot="header">Text</vscode-tab-header>
            <vscode-tab-panel>
                {children ? (
                    <Markdown copySaveButtons={true}>
                        {fenceMD(text, "markdown")}
                    </Markdown>
                ) : null}
            </vscode-tab-panel>
            <vscode-tab-header slot="header">Preview</vscode-tab-header>
            <vscode-tab-panel>
                {md ? (
                    <Markdown
                        copySaveButtons={true}
                        filename={filename}
                        className={className}
                    >
                        {md}
                    </Markdown>
                ) : null}
            </vscode-tab-panel>
        </>
    )
}
