import { Ora } from "ora"
import { Progress } from "genaiscript-core"

export class ProgressSpinner implements Progress {
    constructor(readonly spinner: Ora) {}
    report(value: {
        message?: string
        increment?: number
        succeeded?: boolean
    }): void {
        const { message, succeeded } = value
        if (succeeded === true) {
            this.spinner.succeed(message)
        } else if (succeeded === false) {
            this.spinner.fail(message)
        } else if (message) this.spinner.start(message)
    }
}
