import React, { useMemo } from "react"
import { fenceMD } from "../../core/src/mkmd"
import Markdown from "./Markdown"
import { convertThinkToMarkdown } from "../../core/src/think"
import { convertAnnotationsToMarkdown } from "../../core/src/annotations"

import "@vscode-elements/elements/dist/vscode-tab-header"
import "@vscode-elements/elements/dist/vscode-tab-panel"

function cleanMarkdown(res: string): string {
    return res?.replace(/(\r?\n){3,}/g, "\n\n")
}

export default function MarkdownWithPreviewTabs(props: {
    className?: string
    filename?: string
    text?: string
}) {
    const { className, filename, text } = props
    const cleaned = useMemo(() => cleanMarkdown(text), [text])
    const md = useMemo(
        () => cleanMarkdown(convertThinkToMarkdown(convertAnnotationsToMarkdown(cleaned))),
        [cleaned]
    )
    return (
        <>
            <vscode-tab-header slot="header">Text</vscode-tab-header>
            <vscode-tab-panel>
                {text ? (
                    <Markdown
                        copySaveButtons={true}
                        filename={filename}
                        text={cleaned}
                    >
                        {fenceMD(cleaned, "markdown")}
                    </Markdown>
                ) : null}
            </vscode-tab-panel>
            <vscode-tab-header slot="header">Preview</vscode-tab-header>
            <vscode-tab-panel>
                {md ? (
                    <Markdown
                        copySaveButtons={true}
                        filename={filename}
                        text={cleaned}
                        className={className}
                    >
                        {md}
                    </Markdown>
                ) : null}
            </vscode-tab-panel>
        </>
    )
}
