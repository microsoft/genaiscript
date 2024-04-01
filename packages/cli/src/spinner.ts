import ora, { Ora } from "ora"
import { Progress } from "genaiscript-core"

export class ProgressSpinner implements Progress {
    constructor(readonly spinner: Ora) {}

    report(value: {
        message?: string
        count?: number
        succeeded?: boolean
    }): void {
        const { message, count, succeeded } = value
        if (succeeded === true) {
            this.spinner.succeed(message)
            this.spinner.stopAndPersist()
        } else if (succeeded === false) {
            this.spinner.fail(message)
            this.spinner.stopAndPersist()
        } else if (message) {
            this.spinner.suffixText = ""
            this.spinner.start(message)
        }
        if (!isNaN(count)) {
            this.spinner.suffixText = "" + count
        }
    }

    warn(message: string) {
        this.spinner.warn(message)
    }

    get text() {
        return this.spinner.text
    }

    start(message: string) {
        this.report({ message })
    }

    succeed(message?: string) {
        this.report({ message, succeeded: true })
    }

    fail(message: string) {
        this.report({ message, succeeded: false })
    }
}

export function createProgressSpinner(
    message: string,
    interval = 200
): ProgressSpinner {
    return new ProgressSpinner(ora({ interval }).start(message))
}
