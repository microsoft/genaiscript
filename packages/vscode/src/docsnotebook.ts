import * as vscode from "vscode"
import { ExtensionState } from "./state"
import {
    details,
    fenceMD,
    Fragment,
    indent,
    MARKDOWN_MIME_TYPE,
    stringToPos,
    TextFile,
    TOOL_NAME,
    renderMessagesToMarkdown,
    YAMLStringify,
    parsePromptScriptMeta,
    EMOJI_FAIL,
    errorMessage,
    serializeError,
    MDX_REGEX,
} from "genaiscript-core"

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

function clean(o: any) {
    o = structuredClone(o)
    Object.keys(o).forEach((k) => {
        const v = o[k]
        if (v === undefined) delete o[k]
        if (Array.isArray(v) && v.length === 0) delete o[k]
        else if (typeof v === "object" && JSON.stringify(v) == "{}") delete o[k]
    })
    return o
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

    const env: Record<string, object> = {}
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
                const template: PromptScript = {
                    ...meta,
                    id: "notebook-cell-" + cell.index,
                    jsSource,
                }
                const fragment: Fragment = {
                    id: "notebook-cell-" + cell.index,
                    text: "",
                    references: [],
                    fullId: "",
                    title: "",
                    hash: "",
                    file: new TextFile(
                        project,
                        "notebook.cell." + cell.index + ".txt",
                        "text/plain",
                        ""
                    ),
                    startPos: [0, 0],
                    endPos: stringToPos(""),
                }
                await state.requestAI({
                    template,
                    label: "Executing cell",
                    parameters: env,
                    fragment,
                    notebook: true,
                })
                const res = state.aiRequest?.response
                if (!res) throw new Error("No GenAI result")

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
                    trace,
                    messages,
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
                env.output = output

                let chat = renderMessagesToMarkdown(messages)
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
                                details(
                                    "env.vars.output",
                                    fenceMD(
                                        YAMLStringify(clean(output)),
                                        "yaml"
                                    )
                                ) + details("trace", trace),
                                MARKDOWN_MIME_TYPE
                            ),
                        ]),
                    ].filter((o) => o)
                )
                execution.end(!error, Date.now())
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

    subscriptions.push(
        vscode.workspace.registerNotebookSerializer(
            NOTEBOOK_TYPE,
            {
                deserializeNotebook: (
                    data: Uint8Array,
                    token: vscode.CancellationToken
                ): vscode.NotebookData => {
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
                                    indentation: data.indentation,
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
                },
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
                            const indentation = cell.metadata?.indentation || ""
                            const options = cell.metadata?.options || ""
                            const languageAbbrev =
                                NOTEBOOK_LANG_ABBREVS.get(cell.languageId) ??
                                cell.languageId
                            const codePrefix =
                                "```" +
                                languageAbbrev +
                                (options ? ` ${options}` : "") +
                                "\n"
                            result += indent(
                                codePrefix + cell.value + "\n```",
                                indentation
                            )
                            const output = cell.outputs?.[0]?.items?.[0]
                            if (output && output.mime === MARKDOWN_MIME_TYPE) {
                                result += decoder.decode(output.data)
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
}

interface RawNotebookCell {
    indentation?: string
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
    indentation: string
    options: string
}

/**
 * Note - the indented code block parsing is basic. It should only be applied inside lists,
 * indentation should be consistent across lines and
 * between the start and end blocks, etc. This is good enough for typical use cases.
 */
function parseCodeBlockStart(line: string): ICodeBlockStart | null {
    const match = line.match(/(    |\t)?```(\S*)\s*(.+)?$/)
    return (
        match && {
            indentation: match[1],
            langId: match[2],
            options: match[3] || "",
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
                ) {
                    cf = true
                    break
                }
                cs++
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

    function parseCodeBlock(
        leadingWhitespace: string,
        codeBlockStart: ICodeBlockStart
    ): RawNotebookCell {
        const language =
            NOTEBOOK_LANG_IDS.get(codeBlockStart.langId) ||
            codeBlockStart.langId
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
        const content = lines
            .slice(startSourceIdx, i - 1)
            .map((line) =>
                line.replace(new RegExp("^" + codeBlockStart.indentation), "")
            )
            .join("\n")
        const trailingWhitespace = parseWhitespaceLines(false)
        const cell = {
            language,
            options,
            content,
            kind: vscode.NotebookCellKind.Code,
            leadingWhitespace: leadingWhitespace,
            trailingWhitespace: trailingWhitespace,
            indentation: codeBlockStart.indentation,
        }
        cells.push(cell)
        return cell
    }

    function parseMarkdownParagraph(leadingWhitespace: string): void {
        const startSourceIdx = i
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
