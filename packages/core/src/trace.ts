import {
    CHANGE,
    EMOJI_FAIL,
    EMOJI_SUCCESS,
    EMOJI_UNDEFINED,
    TOOL_ID,
    TRACE_CHUNK,
    TRACE_DETAILS,
} from "./constants"
import { fenceMD, parseTraceTree, TraceTree } from "./markdown"
import { stringify as yamlStringify } from "yaml"
import { YAMLStringify } from "./yaml"
import { errorMessage, serializeError } from "./error"
import prettyBytes from "pretty-bytes"
import { host } from "./host"
import { ellipse, renderWithPrecision, toStringList } from "./util"
import { estimateTokens } from "./tokens"
import { hideSecrets } from "./secrets"

export class TraceChunkEvent extends Event {
    constructor(readonly chunk: string) {
        super(TRACE_CHUNK)
    }
}

export class MarkdownTrace extends EventTarget implements ToolCallTrace {
    readonly _errors: { message: string; error: SerializedError }[] = []
    private detailsDepth = 0
    private _content: (string | MarkdownTrace)[] = []
    private _tree: TraceTree

    constructor(
        readonly options?: {
            encoder?: TokenEncoder
        }
    ) {
        super()
        this.options = options || {}
    }

    private disableChangeDispatch = 0
    dispatchChange() {
        if (!this.disableChangeDispatch) this.dispatchEvent(new Event(CHANGE))
    }

    get tree() {
        if (!this._tree) this._tree = parseTraceTree(this.content)
        return this._tree
    }

    get content(): string {
        return this._content
            .map((c) => (typeof c === "string" ? c : c.content))
            .join("")
    }

    startTraceDetails(title: string) {
        const trace = new MarkdownTrace({ ...this.options })
        trace.addEventListener(TRACE_CHUNK, (ev) =>
            this.dispatchEvent(
                new TraceChunkEvent((ev as TraceChunkEvent).chunk)
            )
        )
        trace.addEventListener(TRACE_DETAILS, () =>
            this.dispatchEvent(new Event(TRACE_DETAILS))
        )
        trace.startDetails(title)
        this._content.push(hideSecrets(title))
        return trace
    }

    appendContent(value: string) {
        if (value !== undefined && value !== null && value !== "") {
            this._content.push(hideSecrets(value))
            this._tree = undefined
            this.dispatchChange()
            this.dispatchEvent(new TraceChunkEvent(value))
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

    detailsFenced(title: string, body: string | object, contentType?: string) {
        this.disableChange(() => {
            this.startDetails(title)
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

    fence(message: string | unknown, contentType?: string) {
        if (message === undefined || message === null || message === "") return

        let res: string
        if (typeof message !== "string") {
            if (contentType === "json") {
                res = JSON.stringify(message, null, 2)
            } else {
                res = yamlStringify(message)
                contentType = "yaml"
            }
        } else res = message
        this.appendContent(fenceMD(res, contentType))
    }

    tip(message: string) {
        this.appendContent(`> ${message}\n`)
    }

    heading(level: number, message: string) {
        this.appendContent(`${"#".repeat(level)} ${message}\n\n`)
    }

    image(url: string, caption?: string) {
        this.appendContent(`\n![${caption || url}](${url})\n`)
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
                const encoder = host.createUTF8Encoder()
                for (const file of files) {
                    const content = file.content ?? ""
                    const buf = encoder.encode(content)
                    const size = prettyBytes(buf.length)
                    const score = !isNaN(file.score)
                        ? `score: ${renderWithPrecision(file.score || 0, 2)}`
                        : undefined
                    const tokens =
                        model && this.options?.encoder
                            ? `${estimateTokens(content, this.options.encoder)} t`
                            : undefined
                    const suffix = toStringList(tokens, size, score)
                    if (maxLength > 0) {
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
                        const ext = host.path.extname(file.filename).slice(1)
                        this.detailsFenced(
                            `<code>${file.filename}</code>: ${suffix}`,
                            preview,
                            ext
                        )
                    } else
                        this.itemValue(
                            `\`${file.filename}\``,
                            toStringList(tokens, size, score)
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

export interface AbortSignalOptions {
    signal?: AbortSignal
}
