import { fenceMD } from "./expander"
import { stringify as yamlStringify } from "yaml"

export class MarkdownTrace
    extends EventTarget
    implements ChatFunctionCallTrace
{
    private _content: string = ""

    static readonly CHANGE = "change"

    constructor() {
        super()
    }

    private disableChangeDispatch = 0
    dispatchChange() {
        if (!this.disableChangeDispatch)
            this.dispatchEvent(new Event(MarkdownTrace.CHANGE))
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
        this.content += `\n\n<details id="${title.replace(
            /\s+/g,
            "-"
        )}" class="gptools"><summary>
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

    log(message: string) {
        this.content += message + "\n"
    }

    fence(message: string | unknown, contentType?: string) {
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

    error(message: string, exception?: unknown) {
        this.guarded(() => {
            this.content += `\n> error: ${message}\n`
            if (typeof exception === "string") this.fence(exception)
            else if (exception)
                this.fence(
                    `${(exception as Error).message}\n${
                        (exception as Error).stack || ""
                    }`
                )
        })
    }
}
