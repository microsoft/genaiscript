import {
    VscodeTabHeader,
    VscodeTabPanel,
    VscodeTabs,
} from "@vscode-elements/react-elements"
import React from "react"
import { fenceMD } from "../../core/src/mkmd"
import Markdown from "./Markdown"
import { convertThinkToMarkdown } from "../../core/src/think"
import { convertAnnotationsToMarkdown } from "../../core/src/annotations"

export default function MarkdownWithPreview(props: {
    className?: string
    children: any
}) {
    const { className, children } = props
    const childrenAsString = typeof children === "string" ? children : ""
    if (!childrenAsString)
        return <Markdown className={className}>{children}</Markdown>

    const md = convertThinkToMarkdown(
        convertAnnotationsToMarkdown(childrenAsString)
    )

    return (
        <VscodeTabs>
            <VscodeTabHeader slot="header">Preview</VscodeTabHeader>
            <VscodeTabPanel>
                <Markdown className={className}>{md}</Markdown>
            </VscodeTabPanel>
            <VscodeTabHeader slot="header">Source</VscodeTabHeader>
            <VscodeTabPanel>
                <Markdown>{fenceMD(children, "markdown")}</Markdown>
            </VscodeTabPanel>
        </VscodeTabs>
    )
}
