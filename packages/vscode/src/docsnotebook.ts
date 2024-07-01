import * as vscode from "vscode"
import { ExtensionState } from "./state"
import {
    details,
    Fragment,
    MARKDOWN_MIME_TYPE,
    TOOL_NAME,
    renderMessagesToMarkdown,
    YAMLStringify,
    parsePromptScriptMeta,
    EMOJI_FAIL,
    errorMessage,
    MDX_REGEX,
    frontmatterTryParse,
    YAMLTryParse,
    arrayify,
    parseKeyValuePairs,
    parseBoolean,
} from "genaiscript-core"
import { Utils } from "vscode-uri"
import { register } from "tsx/cjs/api"
import { registerCommand } from "./commands"

// parser
// https://raw.githubusercontent.com/microsoft/vscode-markdown-notebook/main/src/markdownParser.ts

const NOTEBOOK_ID = "genaiscript"
const NOTEBOOK_TYPE = "genaiscript"
const NOTEBOOK_LANG_IDS = new Map([
    ["sh", "bash"],
    ["bat", "batch"],
    ["c++", "cpp"],
    ["js", "javascript"],
    ["ts", "typescript"],
    ["cs", "csharp"],
    ["py", "python"],
    ["py2", "python"],
    ["py3", "python"],
    ["md", "markdown"],
    ["mdx", "mdx"],
])
const NOTEBOOK_LANG_ABBREVS = new Map(
    Array.from(NOTEBOOK_LANG_IDS.keys()).map((k) => [
        NOTEBOOK_LANG_IDS.get(k),
        k,
    ])
)
const NOTEBOOK_MARKERS: Record<
    string,
    { startMarker: string; endMarker: string }
> = {
    markdown: {
        startMarker: "<!-- genaiscript output start -->",
        endMarker: "<!-- genaiscript output end -->",
    },
    mdx: {
        startMarker: "{/* genaiscript output start */}",
        endMarker: "{/* genaiscript output end */}",
    },
}

export async function activateDocsNotebook(state: ExtensionState) {
    activateNotebookSerializer(state)
    activateNotebookExecutor(state)
}

function activateNotebookExecutor(state: ExtensionState) {
    const { context } = state
    const { subscriptions } = context

    const controller = vscode.notebooks.createNotebookController(
        NOTEBOOK_ID,
        NOTEBOOK_TYPE,
        TOOL_NAME
    )
    subscriptions.push(controller)
    controller.supportedLanguages = ["javascript"]
    controller.supportsExecutionOrder = true
    controller.description = "GenAIScript interactive notebook"

    const heap: Record<string, object> = {}
    let executionId = 0
    let executionOrder = 0
    controller.interruptHandler = async () => {
        executionId++
        await state.cancelAiRequest()
    }
    controller.executeHandler = async (cells, notebook) => {
        const currentExecutionId = executionId
        await state.cancelAiRequest()
        await state.parseWorkspace()
        const project = state.project

        const firstCell = notebook.cellAt(0)
        const frontMatterText = firstCell?.document?.getText()
        const { genaiscript: frontmatter = {} } =
            frontmatterTryParse(frontMatterText)?.value ??
            YAMLTryParse(frontMatterText) ??
            {}
        const {
            model,
            files,
            vars,
        }: {
            model?: string
            vars?: Record<string, any>
            files?: string | string[]
        } = frontmatter || {}

        for (const cell of cells) {
            if (executionId !== currentExecutionId) return
            const execution = controller.createNotebookCellExecution(cell)
            execution.executionOrder = executionOrder++
            const mdx = MDX_REGEX.test(cell.document.fileName)
            const syntax = mdx
                ? NOTEBOOK_MARKERS.mdx
                : NOTEBOOK_MARKERS.markdown

            try {
                execution.start(Date.now())
                execution.clearOutput()
                const jsSource = cell.document.getText()
                if (jsSource.trim() === "") {
                    execution.end(true, Date.now())
                    continue
                }
                const meta = parsePromptScriptMeta(jsSource)
                if (model) meta.model = model
                const template: PromptScript = {
                    ...meta,
                    id: "notebook-cell-" + cell.index,
                    jsSource,
                }
                const fragment: Fragment = {
                    files: arrayify(files),
                }
                const parameters = { ...heap, ...vars }
                await state.requestAI({
                    template,
                    label: "Executing cell",
                    parameters,
                    fragment,
                    notebook: true,
                })
                const res = state.aiRequest?.response
                if (!res) throw new Error("No GenAI result")

                const trace = state.aiRequest?.trace
                const {
                    error,
                    text,
                    fileEdits,
                    changelogs,
                    annotations,
                    edits,
                    fences,
                    frames,
                    schemas,
                    messages,
                    status,
                } = res
                const output = {
                    text,
                    fileEdits,
                    changelogs,
                    annotations,
                    edits,
                    fences,
                    frames,
                    schemas,
                }
                heap.output = output

                const {
                    system = meta.system?.length > 0 ? undefined : "false",
                    user,
                    assistant,
                } = parseKeyValuePairs(cell.metadata.options || "") || {}
                let chat = renderMessagesToMarkdown(messages, {
                    system: parseBoolean(system),
                    user: parseBoolean(user),
                    assistant: parseBoolean(assistant),
                })
                if (error)
                    chat += details(`${EMOJI_FAIL} error`, errorMessage(error))
                chat =
                    "\n\n" +
                    syntax.startMarker +
                    "\n" +
                    chat +
                    "\n" +
                    syntax.endMarker +
                    "\n\n"

                // call LLM
                await execution.replaceOutput(
                    [
                        new vscode.NotebookCellOutput([
                            vscode.NotebookCellOutputItem.text(
                                chat,
                                MARKDOWN_MIME_TYPE
                            ),
                        ]),
                        new vscode.NotebookCellOutput([
                            vscode.NotebookCellOutputItem.text(
                                /*details(
                                    "env.vars.output",
                                    fenceMD(
                                        YAMLStringify(clean(output)),
                                        "yaml"
                                    )
                                ) + */ details("trace", trace.content),
                                MARKDOWN_MIME_TYPE
                            ),
                        ]),
                    ].filter((o) => o)
                )
                execution.end(status === "success", Date.now())
            } catch (e) {
                await execution.replaceOutput([
                    new vscode.NotebookCellOutput([
                        vscode.NotebookCellOutputItem.error(e),
                    ]),
                ])
                execution.end(false, Date.now())
            }
        }
    }
}

function activateNotebookSerializer(state: ExtensionState) {
    const { context } = state
    const { subscriptions } = context
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const deserializeNotebook: (
        data: Uint8Array,
        token: vscode.CancellationToken
    ) => vscode.NotebookData = (data, token) => {
        const content = decoder.decode(data)
        const cellRawData = parseMarkdown(content)
        const cells = cellRawData.map(
            (data) =>
                <vscode.NotebookCellData>{
                    kind: data.kind,
                    languageId: data.language,
                    metadata: {
                        leadingWhitespace: data.leadingWhitespace,
                        trailingWhitespace: data.trailingWhitespace,
                        options: data.options,
                        runnable: data.language === "javascript",
                        editable: true,
                        custom: true,
                    },
                    outputs: data.output
                        ? [
                              new vscode.NotebookCellOutput([
                                  vscode.NotebookCellOutputItem.text(
                                      data.output,
                                      MARKDOWN_MIME_TYPE
                                  ),
                              ]),
                          ]
                        : [],
                    value: data.content,
                }
        )

        const res = new vscode.NotebookData(cells)
        return res
    }

    subscriptions.push(
        vscode.workspace.registerNotebookSerializer(
            NOTEBOOK_TYPE,
            {
                deserializeNotebook,
                serializeNotebook: function (
                    data: vscode.NotebookData,
                    token: vscode.CancellationToken
                ): Uint8Array {
                    const { cells } = data
                    let result = ""
                    for (let i = 0; i < cells.length; i++) {
                        const cell = cells[i]
                        if (i === 0)
                            result += cell.metadata?.leadingWhitespace ?? ""

                        if (cell.kind === vscode.NotebookCellKind.Code) {
                            if (cell.languageId === "yaml" && i === 0) {
                                result += `---\n${cell.value}\n---\n`
                            } else {
                                const options = cell.metadata?.options || ""
                                const languageAbbrev =
                                    NOTEBOOK_LANG_ABBREVS.get(
                                        cell.languageId
                                    ) ?? cell.languageId
                                const codePrefix =
                                    "```" +
                                    languageAbbrev +
                                    (options ? ` ${options}` : "") +
                                    "\n"
                                result += codePrefix + cell.value + "\n```"
                                const output = cell.outputs?.[0]?.items?.[0]
                                if (
                                    output &&
                                    output.mime === MARKDOWN_MIME_TYPE
                                ) {
                                    result += decoder.decode(output.data)
                                }
                            }
                        } else {
                            result += cell.value
                        }

                        result += getBetweenCellsWhitespace(cells, i)
                    }
                    return encoder.encode(result)
                },
            },
            { transientOutputs: false }
        )
    )

    subscriptions.push(
        registerCommand(
            "genaiscript.notebook.create",
            async (uri?: vscode.Uri) => {
                uri = uri || Utils.joinPath(context.extensionUri, "tutorial.md")
                const canceller = new vscode.CancellationTokenSource()
                const bytes = await vscode.workspace.fs.readFile(uri)
                const data = deserializeNotebook(bytes, canceller.token)
                const notebook = await vscode.workspace.openNotebookDocument(
                    NOTEBOOK_TYPE,
                    data
                )
                vscode.window.showNotebookDocument(notebook)
            }
        )
    )
}

interface RawNotebookCell {
    leadingWhitespace: string
    trailingWhitespace: string
    language: string
    options?: string
    content: string
    kind: vscode.NotebookCellKind
    output?: string
}

interface ICodeBlockStart {
    langId: string
    options: string
}

/**
 * Note - the indented code block parsing is basic. It should only be applied inside lists,
 * indentation should be consistent across lines and
 * between the start and end blocks, etc. This is good enough for typical use cases.
 */
function parseCodeBlockStart(line: string): ICodeBlockStart | null {
    const match = line.match(/^```(\S*)\s*(.+)?$/)
    return (
        match && {
            langId: match[1],
            options: match[2] || "",
        }
    )
}

function isCodeBlockStart(line: string): boolean {
    return !!parseCodeBlockStart(line)
}

function isCodeBlockEndLine(line: string): boolean {
    return !!line.match(/^\s*```/)
}

function parseMarkdown(content: string): RawNotebookCell[] {
    const lines = content.split(/\r?\n/g)
    let cells: RawNotebookCell[] = []
    let i = 0

    // eat frontmatter
    const frontmatter = frontmatterTryParse(content)
    if (frontmatter) {
        i = frontmatter.end
        cells.push({
            language: "yaml",
            content: YAMLStringify(frontmatter.value),
            kind: vscode.NotebookCellKind.Code,
            leadingWhitespace: "",
            trailingWhitespace: "",
        })
    }

    // Each parse function starts with line i, leaves i on the line after the last line parsed
    while (i < lines.length) {
        const leadingWhitespace = i === 0 ? parseWhitespaceLines(true) : ""
        if (i >= lines.length) {
            break
        }
        const line = lines[i]
        const codeBlockMatch = parseCodeBlockStart(line)
        if (codeBlockMatch) {
            const lastCell = parseCodeBlock(leadingWhitespace, codeBlockMatch)
            let cs = i
            let cf = false
            while (cs < lines.length) {
                if (lines[cs].trim() === "") {
                    cs++
                    continue
                }
                if (
                    /(<!--|\{\/\*)\s+genaiscript output start\s+(-->|\*\/\})/.test(
                        lines[cs]
                    )
                )
                    cf = true
                break
            }
            if (cf) {
                let ce = cs + 1
                cf = false
                while (ce < lines.length) {
                    if (
                        /(<!--|\{\/\*)\s+genaiscript output end\s+(-->|\*\/\})/.test(
                            lines[ce]
                        )
                    ) {
                        cf = true
                        break
                    }
                    ce++
                }
                if (cf) {
                    ce = ce + 1
                    while (ce < lines.length && lines[ce].trim() === "") ce++
                    const comment = "\n\n" + lines.slice(i, ce).join("\n")
                    lastCell.output = comment
                    i = ce
                }
            }
        } else {
            parseMarkdownParagraph(leadingWhitespace)
        }
    }

    function parseWhitespaceLines(isFirst: boolean): string {
        let start = i
        const nextNonWhitespaceLineOffset = lines
            .slice(start)
            .findIndex((l) => l !== "")
        let end: number // will be next line or overflow
        let isLast = false
        if (nextNonWhitespaceLineOffset < 0) {
            end = lines.length
            isLast = true
        } else {
            end = start + nextNonWhitespaceLineOffset
        }

        i = end
        const numWhitespaceLines = end - start + (isFirst || isLast ? 0 : 1)
        return "\n".repeat(numWhitespaceLines)
    }

    function resolveLanguage(langId: string) {
        return NOTEBOOK_LANG_IDS.get(langId) || langId
    }

    function parseCodeBlock(
        leadingWhitespace: string,
        codeBlockStart: ICodeBlockStart
    ): RawNotebookCell {
        const language = resolveLanguage(codeBlockStart.langId)
        const startSourceIdx = ++i
        while (true) {
            const currLine = lines[i]
            if (i >= lines.length) {
                break
            } else if (isCodeBlockEndLine(currLine)) {
                i++ // consume block end marker
                break
            }

            i++
        }

        const options = codeBlockStart.options || ""
        const content = lines.slice(startSourceIdx, i - 1).join("\n")
        const trailingWhitespace = parseWhitespaceLines(false)
        const cell = {
            language,
            options,
            content,
            kind: vscode.NotebookCellKind.Code,
            leadingWhitespace: leadingWhitespace,
            trailingWhitespace: trailingWhitespace,
        }
        cells.push(cell)
        return cell
    }

    function parseMarkdownParagraph(leadingWhitespace: string): void {
        const startSourceIdx = i
        i++
        while (i < lines.length) {
            const currLine = lines[i]
            if (isCodeBlockStart(currLine)) {
                break
            }
            i++
        }

        const content = lines.slice(startSourceIdx, i).join("\n")
        const trailingWhitespace = parseWhitespaceLines(false)
        cells.push({
            language: "markdown",
            content,
            kind: vscode.NotebookCellKind.Markup,
            leadingWhitespace: leadingWhitespace,
            trailingWhitespace: trailingWhitespace,
        })
    }

    return cells
}

function getBetweenCellsWhitespace(
    cells: ReadonlyArray<vscode.NotebookCellData>,
    idx: number
): string {
    const thisCell = cells[idx]
    const nextCell = cells[idx + 1]

    if (!nextCell) {
        return thisCell.metadata?.trailingWhitespace ?? "\n"
    }

    const trailing = thisCell.metadata?.trailingWhitespace
    const leading = nextCell.metadata?.leadingWhitespace

    if (typeof trailing === "string" && typeof leading === "string") {
        return trailing + leading
    }

    // One of the cells is new
    const combined = (trailing ?? "") + (leading ?? "")
    if (!combined || combined === "\n") {
        return "\n\n"
    }

    return combined
}
