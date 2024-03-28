import { CHANGE, TOOL_ID } from "./constants"
import { fenceMD } from "./markdown"
import { stringify as yamlStringify } from "yaml"
import { YAMLStringify } from "./yaml"
import { ErrorObject, serializeError } from "./error"

export class MarkdownTrace
    extends EventTarget
    implements ChatFunctionCallTrace {
    readonly errors: ErrorObject[] = []
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

    startDetails(title: string) {
        title = title?.trim() || ""
        this.content += `\n\n<details id="${title.replace(
            /\s+/g,
            "-"
        )}" class="${TOOL_ID}">
<summary>
${title}
</summary>

`
    }

    endDetails() {
        this.content += `\n</details>\n\n`
    }

    private guarded(f: () => void) {
        try {
            this.disableChangeDispatch++
            f()
        } finally {
            this.disableChangeDispatch--
            this.dispatchChange()
        }
    }

    details(title: string, body: string | object) {
        this.guarded(() => {
            this.startDetails(title)
            if (body) {
                if (typeof body === "string") this.content += body
                else this.content += yamlStringify(body)
            }
            this.endDetails()
        })
    }

    detailsFenced(title: string, body: string | object, contentType?: string) {
        this.guarded(() => {
            this.startDetails(title)
            this.fence(body, contentType)
            this.endDetails()
        })
    }

    item(message: string) {
        this.content += `-   ${message}\n`
    }

    itemValue(name: string, value: any) {
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
        } else this.item(`${name}: ${value}`)
    }

    log(message: string) {
        this.content += (message ?? "") + "\n"
    }

    startFence(language: string) {
        this.content += `\n\`\`\`\`${language}\n`
    }

    endFence() {
        this.content += "\n````\n"
    }

    fence(message: string | unknown, contentType?: string) {
        if (message === undefined || message === null) return

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

    resultItem(value: boolean, message: string) {
        this.item(
            `${value === true ? `✅` : value === false ? `❌` : "?"} ${message}`
        )
    }

    error(message: string, error?: unknown) {
        this.guarded(() => {
            this.heading(3, `❌ ${message}`)
            if (error) {
                const err = serializeError(error)
                this.errors.push(err)
                this.fence(YAMLStringify(error), "yaml")
            }
        })
    }
}
