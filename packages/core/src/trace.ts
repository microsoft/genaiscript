import {
    CHANGE,
    DEFAULT_MODEL,
    EMOJI_FAIL,
    EMOJI_SUCCESS,
    EMOJI_UNDEFINED,
    TOOL_ID,
    TRACE_FILE_PREVIEW_MAX_LENGTH,
} from "./constants"
import { fenceMD } from "./markdown"
import { stringify as yamlStringify } from "yaml"
import { YAMLStringify } from "./yaml"
import { errorMessage, serializeError } from "./error"
import prettyBytes from "pretty-bytes"
import { host } from "./host"
import { ellipse, renderWithPrecision, toStringList } from "./util"
import { estimateTokens } from "./tokens"

export class MarkdownTrace
    extends EventTarget
    implements ChatFunctionCallTrace
{
    readonly errors: { message: string; error: SerializedError }[] = []
    private detailsDepth = 0
    private _content: string = ""

    constructor() {
        super()
    }

    private disableChangeDispatch = 0
    dispatchChange() {
        if (!this.disableChangeDispatch) this.dispatchEvent(new Event(CHANGE))
    }

    get content() {
        return this._content
    }

    set content(value: string) {
        if (this._content !== value) {
            this._content = value
            this.dispatchChange()
        }
    }

    startDetails(title: string, success?: boolean) {
        this.detailsDepth++
        title = title?.trim() || ""
        this.content += `\n\n<details id="${title.replace(
            /\s+/g,
            "-"
        )}" class="${TOOL_ID}">
<summary>
${this.toResultIcon(success, "")}${title}
</summary>

`
    }

    endDetails() {
        if (this.detailsDepth > 0) {
            this.detailsDepth--
            this.content += `\n</details>\n\n`
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

    details(title: string, body: string | object) {
        this.disableChange(() => {
            this.startDetails(title)
            if (body) {
                if (typeof body === "string") this.content += body
                else this.content += yamlStringify(body)
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
        this.content += `-   ${message}\n`
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
        this.content += "\n> " + (message ?? "") + "\n"
    }

    startFence(language: string) {
        this.content += `\n\`\`\`\`${language}\n`
    }

    endFence() {
        this.content += "\n````\n"
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
        this.content += fenceMD(res, contentType)
    }

    append(trace: MarkdownTrace) {
        this.content += "\n" + trace.content
    }

    tip(message: string) {
        this.content += `> ${message}\n`
    }

    heading(level: number, message: string) {
        this.content += `${"#".repeat(level)} ${message}\n\n`
    }

    image(url: string, caption?: string) {
        this.content += `\n![${caption || url}](${url})\n`
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
            this.errors.push(err)
            this.renderError(err, { details: false })
        })
    }

    renderErrors(): void {
        while (this.detailsDepth > 0) this.endDetails()
        const errors = this.errors || []
        if (errors.length) {
            this.disableChange(() => {
                this.heading(3, "Errors")
                errors.forEach((e) => this.renderError(e, { details: true }))
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
        const msg = message || emsg
        this.disableChange(() => {
            this.caution(msg)
            if (options.details && error?.stack) {
                this.content += `> \`\`\`\`\`\`\`markdown`
                this.content += error.stack
                    .split(/\n/g)
                    .map((line) => `\n> ${line}`)
                this.content += `\n> \`\`\`\`\`\`\`\n`
            }
        })
    }

    warn(msg: string) {
        this.content += `\n> [!WARNING] ${msg}\n`
    }

    caution(msg: string) {
        this.content += `\n> [!CAUTION] ${msg}\n`
    }

    note(msg: string) {
        this.content += `\n> [!NOTE] ${msg}\n`
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
            model = DEFAULT_MODEL,
            maxLength = TRACE_FILE_PREVIEW_MAX_LENGTH,
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
                    const tokens = model
                        ? `${estimateTokens(model, content)} t`
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
