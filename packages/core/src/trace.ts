import { fenceMD } from "./expander"
import { stringify as yamlStringify } from "yaml"

export class MarkdownTrace implements ChatFunctionCallTrace {
    content: string = ""

    startDetails(title: string) {
        this.content += `\n\n<details id="${title.replace(
            /\s+/g,
            "-"
        )}"><summary>
${title}
</summary>

`
    }

    endDetails() {
        this.content += `\n</details>\n\n`
    }

    details(title: string, body: string | object) {
        this.startDetails(title)
        if (body) {
            if (typeof body === "string") this.content += body
            else this.content += yamlStringify(body)
        }
        this.endDetails()
    }

    detailsFenced(title: string, body: string | object, contentType?: string) {
        this.startDetails(title)
        this.fence(body, contentType)
        this.endDetails()
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
        this.content += `\n> error: ${message}\n`
        if (typeof exception === "string") this.fence(exception)
        else if (exception)
            this.fence(
                `${(exception as Error).message}\n${
                    (exception as Error).stack || ""
                }`
            )
    }
}
