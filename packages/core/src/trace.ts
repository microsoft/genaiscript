import { fenceMD } from "./expander"

export class MarkdownTrace {
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

    details(title: string, body: string) {
        this.startDetails(title)
        this.content += body
        this.endDetails()
    }

    detailsFenced(title: string, body: string, contentType?: string) {
        this.startDetails(title)
        this.content += fenceMD(body, contentType)
        this.endDetails()
    }

    item(message: string) {
        this.content += `-   ${message}\n`
    }

    log(message: string) {
        this.content += message + "\n"
    }

    fence(message: string, contentType?: string) {
        this.content += fenceMD(message, contentType)
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
        if (exception) this.fence(exception + "")
    }
}
