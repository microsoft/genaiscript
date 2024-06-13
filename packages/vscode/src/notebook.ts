import * as vscode from "vscode"
import { ExtensionState } from "./state"
import {
    details,
    fenceMD,
    Fragment,
    MARKDOWN_MIME_TYPE,
    stringToPos,
    TextFile,
    TOOL_NAME,
    YAMLStringify,
} from "genaiscript-core"

// parser
// https://raw.githubusercontent.com/microsoft/vscode-markdown-notebook/main/src/markdownParser.ts

const NOTEBOOK_ID = "genaiscript"
const NOTEBOOK_TYPE = "genaiscript"

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

export async function activateNotebook(state: ExtensionState) {
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
            try {
                execution.start(Date.now())
                execution.clearOutput()
                const jsSource = cell.document.getText()
                if (jsSource.trim() === "") {
                    execution.end(true, Date.now())
                    continue
                }
                const template: PromptScript = {
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
                    text,
                    fileEdits,
                    changelogs,
                    annotations,
                    edits,
                    fences,
                    frames,
                    schemas,
                    trace,
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

                // call LLM
                await execution.replaceOutput([
                    new vscode.NotebookCellOutput([
                        vscode.NotebookCellOutputItem.text(
                            res.text,
                            MARKDOWN_MIME_TYPE
                        ),
                    ]),
                    new vscode.NotebookCellOutput([
                        vscode.NotebookCellOutputItem.text(
                            details(
                                "env.vars.output",
                                fenceMD(YAMLStringify(clean(output)), "yaml")
                            ) + details("trace", trace),
                            MARKDOWN_MIME_TYPE
                        ),
                    ]),
                ])
                execution.end(true, Date.now())
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

    activateNotebookSerializer(state)
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
                                    indentation: data.indentation,
                                },
                                outputs: [],
                                value: data.content,
                            }
                    )

                    return new vscode.NotebookData(cells)
                },
                serializeNotebook: function (
                    data: vscode.NotebookData,
                    token: vscode.CancellationToken
                ): Uint8Array {
                    const stringOutput = writeCellsToMarkdown(data.cells)
                    return encoder.encode(stringOutput)
                },
            },
            { transientOutputs: false }
        )
    )

    subscriptions.push(
        vscode.commands.registerCommand(
            "genaiscript.notebook.new",
            async () => {
                const newNotebook = await vscode.workspace.openNotebookDocument(
                    NOTEBOOK_TYPE,
                    new vscode.NotebookData([
                        new vscode.NotebookCellData(
                            vscode.NotebookCellKind.Code,
                            "$`Write a poem`",
                            "javascript"
                        ),
                    ])
                )
                await vscode.commands.executeCommand(
                    "vscode.openWith",
                    newNotebook.uri,
                    NOTEBOOK_TYPE
                )
            }
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
}

const LANG_IDS = new Map([
    ["bat", "batch"],
    ["c++", "cpp"],
    ["js", "javascript"],
    ["ts", "typescript"],
    ["cs", "csharp"],
    ["py", "python"],
    ["py2", "python"],
    ["py3", "python"],
])
const LANG_ABBREVS = new Map(
    Array.from(LANG_IDS.keys()).map((k) => [LANG_IDS.get(k), k])
)

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
    for (; i < lines.length; ) {
        const leadingWhitespace = i === 0 ? parseWhitespaceLines(true) : ""
        if (i >= lines.length) {
            break
        }
        const codeBlockMatch = parseCodeBlockStart(lines[i])
        if (codeBlockMatch) {
            parseCodeBlock(leadingWhitespace, codeBlockMatch)
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
    ): void {
        const language =
            LANG_IDS.get(codeBlockStart.langId) || codeBlockStart.langId
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

        const content = lines
            .slice(startSourceIdx, i - 1)
            .map((line) =>
                line.replace(new RegExp("^" + codeBlockStart.indentation), "")
            )
            .join("\n")
        const trailingWhitespace = parseWhitespaceLines(false)
        cells.push({
            language,
            options: codeBlockStart.options,
            content,
            kind: vscode.NotebookCellKind.Code,
            leadingWhitespace: leadingWhitespace,
            trailingWhitespace: trailingWhitespace,
            indentation: codeBlockStart.indentation,
        })
    }

    function parseMarkdownParagraph(leadingWhitespace: string): void {
        const startSourceIdx = i
        while (true) {
            if (i >= lines.length) {
                break
            }

            const currLine = lines[i]
            if (currLine === "" || isCodeBlockStart(currLine)) {
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

function writeCellsToMarkdown(
    cells: ReadonlyArray<vscode.NotebookCellData>
): string {
    let result = ""
    for (let i = 0; i < cells.length; i++) {
        const cell = cells[i]
        if (i === 0) {
            result += cell.metadata?.leadingWhitespace ?? ""
        }

        if (cell.kind === vscode.NotebookCellKind.Code) {
            const indentation = cell.metadata?.indentation || ""
            const options = cell.metadata?.options || ""
            const languageAbbrev =
                LANG_ABBREVS.get(cell.languageId) ?? cell.languageId
            const codePrefix =
                indentation +
                "```" +
                languageAbbrev +
                (options ? ` ${options}` : "") +
                "\n"
            const contents = cell.value
                .split(/\r?\n/g)
                .map((line) => indentation + line)
                .join("\n")
            const codeSuffix = "\n" + indentation + "```"

            result += codePrefix + contents + codeSuffix
        } else {
            result += cell.value
        }

        result += getBetweenCellsWhitespace(cells, i)
    }
    return result
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
