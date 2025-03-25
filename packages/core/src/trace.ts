import {
    CHANGE,
    EMOJI_FAIL,
    EMOJI_SUCCESS,
    EMOJI_UNDEFINED,
    TOOL_ID,
    TRACE_CHUNK,
    TRACE_DETAILS,
    TRACE_MAX_FENCE_SIZE,
    TRACE_MAX_FILE_SIZE,
} from "./constants"
import { stringify as yamlStringify } from "yaml"
import { YAMLStringify } from "./yaml"
import { errorMessage, serializeError } from "./error"
import { host } from "./host"
import { ellipse, toStringList } from "./util"
import { renderWithPrecision } from "./precision"
import { fenceMD } from "./mkmd"
import { HTMLEscape } from "./html"
import { resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { dedent } from "./indent"
import { CSVStringify, dataToMarkdownTable } from "./csv"
import { INIStringify } from "./ini"
import { ChatCompletionsProgressReport } from "./chattypes"
import { parseTraceTree, TraceTree } from "./traceparser"
import { fileCacheImage, fileWriteCached } from "./filecache"
import { CancellationOptions } from "./cancellation"
import { generateId } from "./id"
import { createDiff } from "./llmdiff"
import { prettyBytes } from "./pretty"

export class TraceChunkEvent extends Event {
    constructor(
        readonly chunk: string,
        readonly inner: boolean,
        readonly progress?: ChatCompletionsProgressReport
    ) {
        super(TRACE_CHUNK)
    }

    clone(): TraceChunkEvent {
        const ev = new TraceChunkEvent(this.chunk, this.inner, this.progress)
        return ev
    }
}

export class MarkdownTrace extends EventTarget implements OutputTrace {
    readonly _errors: { message: string; error: SerializedError }[] = []
    private detailsDepth = 0
    private _content: (string | MarkdownTrace)[] = []
    private _tree: TraceTree

    constructor(readonly options?: CancellationOptions & { dir?: string }) {
        super()
        this.options = options || {}
    }

    private disableChangeDispatch = 0
    dispatchChange() {
        if (!this.disableChangeDispatch) this.dispatchEvent(new Event(CHANGE))
    }

    get tree() {
        if (!this._tree)
            this._tree = parseTraceTree(this.content, { parseItems: true })
        return this._tree
    }

    get content(): string {
        return this._content
            .map((c) => (typeof c === "string" ? c : c.content))
            .join("")
            .replace(/(\r?\n){3,}/g, "\n\n")
    }

    startTraceDetails(
        title: string,
        options?: { expanded?: boolean; success?: boolean }
    ) {
        const trace = new MarkdownTrace({ ...this.options })
        trace.addEventListener(TRACE_CHUNK, (ev) =>
            this.dispatchEvent((ev as TraceChunkEvent).clone())
        )
        trace.addEventListener(TRACE_DETAILS, () =>
            this.dispatchEvent(new Event(TRACE_DETAILS))
        )
        trace.startDetails(title, options)
        this._content.push(trace)
        return trace
    }

    chatProgress(progress: ChatCompletionsProgressReport) {
        const { inner, responseChunk, reasoningChunk } = progress
        if (!responseChunk && !reasoningChunk) return

        if (!inner && responseChunk) {
            this._content.push(responseChunk)
            this._tree = undefined
            this.dispatchChange()
        }
        this.dispatchEvent(new TraceChunkEvent(responseChunk, inner, progress))
    }

    appendContent(value: string) {
        if (value !== undefined && value !== null && value !== "") {
            this._content.push(value)
            this._tree = undefined
            this.dispatchChange()
            this.dispatchEvent(new TraceChunkEvent(value, false))
        }
    }

    appendToken(content: string) {
        if (!content) return
        this.appendContent(
            content.includes("`")
                ? `\`\`\` ${content.replace(/\r?\n/g, " ")} \`\`\` `
                : `\`${content.replace(/\r?\n/g, " ")}\` `
        )
    }

    diff(
        left: string | WorkspaceFile,
        right: string | WorkspaceFile,
        options?: { context?: number }
    ) {
        const d = createDiff(left, right, options)
        this.fence(d, "diff")
    }

    /**
     * Logs a markdown table
     * @param rows
     */
    table(
        rows: object[],
        options?: { headers?: ElementOrArray<string> }
    ): void {
        if (!rows?.length) return
        const md = dataToMarkdownTable(rows, options)
        this.appendContent(`\n\n${md}\n\n`)
    }

    startDetails(
        title: string,
        options?: { success?: boolean; expanded?: boolean }
    ) {
        const { success, expanded } = options || {}
        this.detailsDepth++
        title = title?.trim() || ""
        this
            .appendContent(`\n\n<details class="${TOOL_ID}"${expanded ? ` open="true"` : ""}>
<summary>
${this.toResultIcon(success, "")}${title}
</summary>

`)
    }

    endDetails() {
        if (this.detailsDepth > 0) {
            this.detailsDepth--
            this.appendContent(`\n</details>\n\n`)
            this.dispatchEvent(new Event(TRACE_DETAILS))
        }
    }

    private disableChange(f: () => void) {
        try {
            this.disableChangeDispatch++
            f()
        } finally {
            this.disableChangeDispatch--
            this.dispatchChange()
        }
    }

    video(name: string, filepath: string, alt?: string) {
        const url = pathToFileURL(resolve(filepath))
        this.appendContent(
            dedent`
            -   ${name}
            
            <video src="${url.href}" title="${HTMLEscape(name)}" aria-label="${HTMLEscape(alt || name)}" controls="true"></video>
            
            `
        )
    }

    audio(name: string, filepath: string, alt?: string) {
        const url = pathToFileURL(resolve(filepath))
        this.appendContent(
            dedent`
            -   ${name}
            
            <audio src="${url.href}" title="${HTMLEscape(name)}" aria-label="${HTMLEscape(alt || name)}" controls="true"></audio>
            
            `
        )
    }

    file(file: WorkspaceFile) {
        const { content, filename } = file
        if (!content) {
            this.itemValue(filename, "no content")
        } else {
            this.item(filename)
            const ext = host.path.extname(filename).slice(1)
            this.fence(ellipse(content, TRACE_MAX_FILE_SIZE), ext)
        }
    }

    details(
        title: string,
        body: string | object,
        options?: { success?: boolean; expanded?: boolean }
    ) {
        this.disableChange(() => {
            this.startDetails(title, options)
            if (body) {
                if (typeof body === "string") this.appendContent(body)
                else this.appendContent(yamlStringify(body))
            }
            this.endDetails()
        })
    }

    detailsFenced(
        title: string,
        body: string | object,
        contentType?: string,
        options?: { expanded?: boolean }
    ) {
        this.disableChange(() => {
            this.startDetails(title, options)
            this.fence(body, contentType)
            this.endDetails()
        })
    }

    item(message: string) {
        this.appendContent(`-   ${message}\n`)
    }

    itemValue(name: string, value: any, unit?: string) {
        if (value === undefined || (typeof value === "number" && isNaN(value)))
            return

        if (typeof value === "function")
            this.item(`${name}: ${value.name || "anonymous"}`)
        else if (typeof value === "object" || Array.isArray(value)) {
            const txt = YAMLStringify(value)
            if (txt.includes("\n")) {
                this.item(`${name}:`)
                this.fence(YAMLStringify(value))
            } else this.item(`${name}: ${txt}`)
        } else this.item(`${name}: ${value}${unit ?? ""}`)
    }

    log(message: string) {
        this.fence(message ?? "")
    }

    startFence(language: string) {
        this.appendContent(`\n\`\`\`\`${language}\n`)
    }

    endFence() {
        this.appendContent("\n````\n")
    }

    fence(
        message: string | unknown,
        contentType?: OptionsOrString<"md" | "json" | "csv" | "yaml" | "ini">
    ) {
        if (message === undefined || message === null || message === "") return
        if (contentType === "markdown") contentType = "md"
        if (contentType === "md" && Array.isArray(message)) {
            this.appendContent(dataToMarkdownTable(message))
            return
        }

        let res: string
        if (typeof message !== "string") {
            if (contentType === "json") {
                res = JSON.stringify(message, null, 2)
            } else if (contentType === "ini") {
                res = INIStringify(message)
            } else if (contentType === "csv") {
                res = CSVStringify(
                    Array.isArray(message) ? message : [message],
                    { header: true }
                )
            } else {
                res = yamlStringify(message)
                contentType = "yaml"
            }
        } else res = message

        if (res.length > TRACE_MAX_FENCE_SIZE) {
            const fn = `${generateId()}.${contentType || "txt"}`
            res = ellipse(res, TRACE_MAX_FENCE_SIZE)
        }
        this.appendContent(fenceMD(res, contentType))
    }

    tip(message: string) {
        this.appendContent(`> ${message}\n`)
    }

    heading(level: number, message: string) {
        this.appendContent(`\n\n${"#".repeat(level)} ${message}\n\n`)
    }

    async image(url: string, caption: string) {
        const imageUrl = await fileCacheImage(url, {
            trace: this,
            ...this.options,
        })
        if (!imageUrl) return
        return this.appendContent(
            `\n\n![${caption || "image"}](${imageUrl})\n\n`
        )
    }

    private toResultIcon(value: boolean, missing: string) {
        return value === true
            ? EMOJI_SUCCESS
            : value === false
              ? EMOJI_FAIL
              : missing
    }

    resultItem(value: boolean, message: string) {
        this.item(`${this.toResultIcon(value, EMOJI_UNDEFINED)} ${message}`)
    }

    error(message: string, error?: unknown) {
        this.disableChange(() => {
            const err = {
                message,
                error: serializeError(error),
            }
            this._errors.push(err)
            this.renderError(err, { details: true })
        })
    }

    get errors(): { message: string; error: SerializedError }[] {
        const traces = this._content.filter(
            (c) => typeof c !== "string"
        ) as MarkdownTrace[]
        return this._errors.concat(...traces.map((t) => t.errors))
    }

    renderErrors(): void {
        while (this.detailsDepth > 0) this.endDetails()
        const errors = this.errors || []
        if (errors.length) {
            this.disableChange(() => {
                try {
                    this.startDetails(`${EMOJI_FAIL} Errors`)
                    errors.forEach((e) =>
                        this.renderError(e, { details: true })
                    )
                } finally {
                    this.endDetails()
                }
            })
        }
    }

    private renderError(
        e: {
            message: string
            error?: SerializedError
        },
        options: { details: boolean }
    ) {
        const { message, error } = e
        const emsg = errorMessage(error)
        const msg = [message, emsg].filter((m) => m).join(", ")
        this.disableChange(() => {
            this.item(msg)
            if (options.details && error?.stack) {
                this.appendContent(`> \`\`\`\`\`\`\`markdown`)
                this.appendContent(
                    error.stack
                        .split(/\n/g)
                        .map((line) => `> ${line}`)
                        .join("\n")
                )

                this.appendContent(`\n> \`\`\`\`\`\`\`\n`)
            }
        })
    }

    warn(msg: string) {
        this.appendContent(`\n> [!WARNING]
> ${msg}\n`)
    }

    caution(msg: string) {
        this.appendContent(`\n> [!CAUTION]
> ${msg}\n`)
    }

    note(msg: string) {
        this.appendContent(`\n> [!NOTE]
> ${msg}\n`)
    }

    files(
        files: WorkspaceFileWithScore[],
        options?: {
            model?: string
            maxLength?: number
            title?: string
            skipIfEmpty?: boolean
            secrets?: Record<string, string>
        }
    ) {
        const {
            model,
            maxLength,
            title,
            skipIfEmpty,
            secrets = {},
        } = options || {}
        if (skipIfEmpty && !files.length) return
        this.disableChange(() => {
            try {
                if (title) this.startDetails(title)
                if (model) this.itemValue("model", model)
                const encoder = host.createUTF8Encoder()
                for (const file of files) {
                    const score = !isNaN(file.score)
                        ? `score: ${renderWithPrecision(file.score || 0, 2)}`
                        : undefined
                    let size: string
                    let content: string
                    if (file.encoding) {
                        size = prettyBytes(
                            file.size ??
                                Buffer.from(file.content, file.encoding).length
                        )
                    } else {
                        content = file.content ?? ""
                        size = prettyBytes(
                            file.size ?? encoder.encode(content).length
                        )
                    }
                    const suffix = toStringList(size, score)
                    if (content && maxLength > 0) {
                        let preview = ellipse(content, maxLength).replace(
                            /\b[A-Za-z0-9\-_]{20,40}\b/g,
                            (m) => m.slice(0, 10) + "***"
                        )
                        for (const secret of Object.values(secrets))
                            preview = preview.replaceAll(
                                secret,
                                secret.slice(0, 3) +
                                    "*".repeat(secret.length - 3)
                            )
                        this.detailsFenced(
                            `<code>${file.filename}</code>: ${suffix}`,
                            preview,
                            "text"
                        )
                    } else
                        this.itemValue(
                            `\`${file.filename}\``,
                            toStringList(size, score)
                        )
                }
            } finally {
                if (title) this.endDetails()
            }
        })
    }
}

export interface TraceOptions {
    trace?: MarkdownTrace
}
